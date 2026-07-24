import { createVoiceAgent } from "./voiceAgent.js";
import { queryKnowledgeBase } from "./knowledgeBase.js";
import { handleFunctionCall, voiceFunctions } from "../routes/voice.js";
import Call from "../models/Call.js";
import Appointment from "../models/Appointment.js";
import Organization from "../models/Organization.js";
import { getQuestionsForCall, resolveSpecialty } from "../config/specialtyTemplates.js";
import { TriageEngine } from "./triageEngine.js";
import { EmotionAnalyzer } from "./emotionAnalyzer.js";
import { createLiveTranscription } from "./deepgram.js";
import { registerCall, removeCall, persistCallEvent } from "./callOrchestrator.js";
import {
  createStreamState, createSharedCallbacks, attachDeepgramHandlers,
  attachWsHandlers, saveTranscript as sharedSaveTranscript, getTwilioClient,
} from "./mediaStreamCommon.js";
import { generateLiveNoteChunk, finalizeNote } from "./ambientNoteGenerator.js";
import { getIo } from "./socketManager.js";

const twilioClient = getTwilioClient();

export async function handleMediaStream(ws, req) {
  const callId = req.params.callId;
  const ctx = createStreamState();

  let language = "en";
  let patientName = "";
  let patientInfo = "";
  let questions = [];
  let multiLangEnabled = true;
  let currentLiveNote = null;
  let ambientInterval = null;
  let lastAmbientTranscript = "";
  let patientForCall = null;
  let practiceName = "your healthcare provider";

  try {
    const call = await Call.findById(callId).populate("patient").populate("questionnaire").populate("organization");
    if (call) {
      patientForCall = call.patient;
      language = call.language || "en";

      if (call.organization?.name) {
        practiceName = call.organization.name;
      } else if (call.patient?.organization) {
        const org = await Organization.findById(call.patient.organization).select("name");
        if (org?.name) practiceName = org.name;
      }
      multiLangEnabled = call.language === "multi" || !call.language || call.language === "en";
      if (language !== "multi" && language !== "en") {
        ctx.languageLocked = true;
      }
      patientName = call.patient?.name || "";

      const p = call.patient || {};
      const age = p.dob ? Math.floor((new Date() - new Date(p.dob)) / 31557600000) : null;
      const infoParts = [];
      if (patientName) infoParts.push(`Name: ${patientName}`);
      if (age) infoParts.push(`Age: ${age}`);
      if (p.gender) infoParts.push(`Gender: ${p.gender}`);
      if (p.primaryDiagnosis) infoParts.push(`Diagnosis: ${p.primaryDiagnosis}`);
      if (p.chronicConditions) infoParts.push(`Chronic conditions: ${p.chronicConditions}`);
      if (p.currentMedications) infoParts.push(`Medications: ${p.currentMedications}`);
      if (p.allergies) infoParts.push(`Allergies: ${p.allergies}`);
      if (p.medicalNotes) infoParts.push(`Notes: ${p.medicalNotes}`);
      if (call.summary) infoParts.push(`Call purpose: ${call.summary}`);
      patientInfo = infoParts.join(". ");

      if (call.patient) {
        Appointment.find({
          patient: call.patient._id,
          date: { $gte: new Date() },
          status: { $in: ["scheduled", "confirmed"] },
        }).sort({ date: 1 }).limit(3).select("title date duration reason").then((appts) => {
          if (appts.length > 0) {
            const apptStr = appts.map((a) => `${a.title || "Appointment"} on ${a.date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} at ${a.date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}${a.reason ? ` (${a.reason})` : ""}`);
            patientInfo += `. Upcoming appointments: ${apptStr.join("; ")}.`;
          }
        }).catch(() => {});
      }

      if (call.questionnaire?.questions) {
        questions = call.questionnaire.questions.map((q) => (typeof q === "string" ? q : q.text));
      } else if (call.patient) {
        const spec = call.patient.specialty || "general";
        const clinicType = call.patient.patientType || "human";
        const result = getQuestionsForCall(spec, clinicType, call.summary || "");
        if (result.questions && result.questions.length > 0) {
          questions = [...result.questions];
        }
      }
      if (call.customQuestions?.length > 0) {
        questions = [...questions, ...call.customQuestions];
      }
    }
  } catch {}

  const triageEngine = new TriageEngine({ language });
  const emotionAnalyzer = new EmotionAnalyzer();

  persistCallEvent(callId, "state_change", { event: "call_started", language });

  const agent = createVoiceAgent({
    language: ctx.languageLocked ? language : "en",
    questions,
    patientName,
    patientInfo,
    practiceName,
    triageEngine,
    emotionAnalyzer,
    knowledgeBase: { query: async (query) => queryKnowledgeBase(query) },
    functions: voiceFunctions,
    onFunctionCall: async (name, args) => handleFunctionCall(callId, name, args),
    ...createSharedCallbacks(callId, ws, ctx, {
      logPrefix: "",
      triageEngine,
      emotionAnalyzer,
      agent,
      getTwilioClientFn: () => twilioClient,
    }),
  });

  function startAmbientInterval() {
    if (ambientInterval) return;
    ambientInterval = setInterval(async () => {
      if (!ctx.connectionAlive) return;
      const fullTranscript = agent.conversationHistory.map((h) => `${h.role}: ${h.content}`).join("\n").trim();
      if (!fullTranscript || fullTranscript === lastAmbientTranscript) return;
      lastAmbientTranscript = fullTranscript;
      let specialty = patientForCall?.specialty || "general-practice";
      let clinicType = "human";
      if (patientForCall?.patientType === "pet") clinicType = "veterinary";
      const dentalSpecialties = ["general-dentistry", "orthodontics", "endodontics", "periodontics", "oral-surgery", "prosthodontics", "pediatric-dentistry"];
      if (dentalSpecialties.includes(specialty)) clinicType = "dental";
      try {
        const note = await generateLiveNoteChunk({
          transcriptSoFar: fullTranscript,
          previousNote: currentLiveNote,
          patientContext: patientInfo,
          specialty,
          clinicType,
        });
        if (note) {
          currentLiveNote = note;
          const io = getIo();
          if (io) {
            io.to(`call:${callId}`).to("supervisor-room").emit("call:note-update", {
              callId,
              note,
              timestamp: Date.now(),
              isFinal: false,
            });
          }
        }
      } catch (err) {
        console.error(`[ambient:${callId}] Note generation error:`, err.message);
      }
    }, 30000);
  }
  startAmbientInterval();

  registerCall(callId, { callSid: req.callSid, streamSid: ctx.streamSid });

  const dgConnection = createLiveTranscription({
    language: multiLangEnabled && !ctx.languageLocked ? "flux-general-multi" : language,
    encoding: "mulaw",
    sampleRate: 8000,
    endpointing: 500,
    utteranceEndMs: 1000,
    interimResults: false,
  });

  if (dgConnection) {
    attachDeepgramHandlers(callId, dgConnection, ctx, {
      agent,
      multiLangEnabled,
      language,
    });
  } else {
    console.error(`[${callId}] Deepgram not configured — live transcription unavailable`);
  }

  attachWsHandlers(ws, ctx, {
    callId,
    agent,
    dgConnection,
    cleanup,
    onWsClose: async () => {
      if (currentLiveNote) {
        const fullTranscript = agent.conversationHistory.map((h) => `${h.role}: ${h.content}`).join("\n").trim();
        let specialty = patientForCall?.specialty || "general-practice";
        let clinicType = "human";
        if (patientForCall?.patientType === "pet") clinicType = "veterinary";
        const dentalSpecialties = ["general-dentistry", "orthodontics", "endodontics", "periodontics", "oral-surgery", "prosthodontics", "pediatric-dentistry"];
        if (dentalSpecialties.includes(specialty)) clinicType = "dental";
        try {
          const finalData = await finalizeNote({
            transcriptFull: fullTranscript,
            patientContext: patientInfo,
            specialty,
            clinicType,
            callId,
          });
          if (finalData) {
            currentLiveNote = { ...currentLiveNote, ...finalData };
            const io = getIo();
            if (io) {
              io.to(`call:${callId}`).to("supervisor-room").emit("call:note-update", {
                callId,
                note: currentLiveNote,
                timestamp: Date.now(),
                isFinal: true,
              });
            }
            try {
              const { default: ClinicalNote } = await import("../models/ClinicalNote.js");
              await ClinicalNote.create({
                patient: patientForCall?._id,
                organization: patientForCall?.organization || null,
                specialty,
                clinicType,
                encounterDate: new Date(),
                encounterType: "phone",
                subjective: finalData.subjective || "",
                objective: finalData.objective || "",
                assessment: finalData.assessment || "",
                plan: finalData.plan || "",
                diagnoses: finalData.diagnoses || [],
                vitals: finalData.vitals || {},
                createdBy: null,
              });
              console.log(`[ambient:${callId}] ClinicalNote saved`);
            } catch (noteErr) {
              console.error(`[ambient:${callId}] ClinicalNote save error:`, noteErr.message);
            }
          }
        } catch (err) {
          console.error(`[ambient:${callId}] Finalize error:`, err.message);
        }
      }
      await sharedSaveTranscript(callId, agent.conversationHistory);
    },
  });

  function cleanup() {
    if (ambientInterval) {
      clearInterval(ambientInterval);
      ambientInterval = null;
    }
    agent.reset();
    removeCall(callId);
    if (dgConnection) {
      try { dgConnection.requestClose(); dgConnection.disconnect(); } catch {}
    }
    ctx.connectionAlive = false;
  }
}
