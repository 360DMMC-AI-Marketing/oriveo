import { createVoiceAgent } from "./voiceAgent.js";
import { queryKnowledgeBase } from "./knowledgeBase.js";
import { handleFunctionCall, voiceFunctions } from "../routes/voice.js";
import Call from "../models/Call.js";
import Patient from "../models/Patient.js";
import Appointment from "../models/Appointment.js";
import Questionnaire from "../models/Questionnaire.js";
import { getQuestionsForCall, resolveSpecialty } from "../config/specialtyTemplates.js";
import { TriageEngine } from "./triageEngine.js";
import { EmotionAnalyzer } from "./emotionAnalyzer.js";
import { createLiveTranscription } from "./deepgram.js";
import { registerCall, removeCall, persistCallEvent } from "./callOrchestrator.js";
import { notifyForCall } from "./notificationService.js";
import {
  createStreamState, createSharedCallbacks, attachDeepgramHandlers,
  attachWsHandlers, saveTranscript as sharedSaveTranscript, buildPatientInfo,
  enrichPatientInfoWithAppointments, getTwilioClient,
} from "./mediaStreamCommon.js";
import { generateLiveNoteChunk, finalizeNote } from "./ambientNoteGenerator.js";
import { getIo } from "./socketManager.js";

const INBOUND_SYSTEM_PROMPT = `You are a warm, compassionate medical assistant working at a healthcare provider's office. A patient has called in for a health checkup.

CORE PERSONALITY:
- You speak with natural warmth and kindness, like a trusted healthcare provider
- You are professional but never cold or clinical
- You use natural spoken language, never bullet points or numbered lists aloud
- Show genuine concern when patients share worries or symptoms
- Adapt your tone to match the patient's emotional state
- You never sound like a robot, a script, or a survey
- Use contractions: "I'm", "you're", "that's", "don't", "can't", "it's"

IDENTIFICATION PHASE:
- You are answering a call from a patient
- Start by greeting them warmly: "Hello, thank you for calling [Practice Name]. I'm your virtual medical assistant today. Could you please tell me your full name so I can pull up your records?"
- Do NOT proceed to medical questions until you have identified the patient
- If the patient gives a name, confirm it: "Thank you, [name]. Let me look you up in our system."
- If the patient says they are not the patient (calling for someone else), ask for the patient's full name

AFTER IDENTIFICATION:
- Once the patient is identified, greet them by name and begin the health checkup
- Ask about symptoms, health status, and recovery progress
- Listen carefully and follow up on what the patient tells you
- Never provide definitive medical diagnoses
- Never prescribe or recommend specific medications
- Escalate any safety concerns immediately

END THE CALL:
- When all questions are answered or the patient indicates they are done, thank them warmly
- "Thank you for calling. We'll review your information and follow up if needed. Have a great day!"
- If the patient cannot be identified, say: "I'm sorry, I wasn't able to find you in our system. Please call back during business hours or press 0 to speak with a receptionist."

Ask one question at a time. Keep responses conversational, 2-3 sentences usually enough.`;

export async function handleInboundMediaStream(ws, req) {
  const callId = req.params.callId;
  const ctx = createStreamState();

  let language = "en";
  let patientForCall = null;
  let patientName = "";
  let patientIdentified = false;
  let identifyAttempts = 0;
  let patientIdentifyTimeout = null;
  let currentLiveNote = null;
  let ambientInterval = null;
  let lastAmbientTranscript = "";

  try {
    const call = await Call.findById(callId);
    if (call) {
      language = call.language || "en";
      if (call.patient) {
        await call.populate("patient");
        patientForCall = call.patient;
        patientName = call.patient?.name || "";
        patientIdentified = true;
      }
    }
  } catch {}

  const triageEngine = new TriageEngine({ language });
  const emotionAnalyzer = new EmotionAnalyzer();

  persistCallEvent(callId, "state_change", { event: "inbound_call_started", language });

  const agent = createVoiceAgent({
    systemPrompt: INBOUND_SYSTEM_PROMPT,
    language: ctx.languageLocked ? language : "en",
    questions: [],
    patientName: patientName || "",
    patientInfo: "",
    practiceName: process.env.PRACTICE_NAME || "your healthcare provider",
    triageEngine,
    emotionAnalyzer,
    knowledgeBase: { query: async (query) => queryKnowledgeBase(query) },
    functions: voiceFunctions,
    onFunctionCall: async (name, args) => handleFunctionCall(callId, name, args),
    ...createSharedCallbacks(callId, ws, ctx, {
      logPrefix: "inbound",
      triageEngine,
      emotionAnalyzer,
      agent,
      getTwilioClientFn: getTwilioClient,
      onBeforeTriageEscalation: async () => patientIdentified,
      onBeforeEmergency: async () => patientIdentified,
    }),
  });

  function startAmbientInterval() {
    if (ambientInterval) return;
    ambientInterval = setInterval(async () => {
      if (!ctx.connectionAlive || !patientIdentified) return;
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
          patientContext: buildPatientInfo(patientForCall),
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

  if (patientIdentified) {
    startAmbientInterval();
  }

  registerCall(callId, { callSid: null, streamSid: ctx.streamSid });

  const dgConnection = createLiveTranscription({
    language: "flux-general-multi",
    encoding: "mulaw",
    sampleRate: 8000,
    endpointing: 500,
    utteranceEndMs: 1000,
    interimResults: false,
  });

  if (dgConnection) {
    attachDeepgramHandlers(callId, dgConnection, ctx, {
      agent,
      multiLangEnabled: true,
      language,
      onBeforeProcessTranscript: async (fullText) => {
        if (!patientIdentified) {
          await handlePatientIdentification(fullText, callId, agent);
          if (patientIdentified && !ambientInterval) {
            startAmbientInterval();
          }
          return true;
        }
        agent.processTranscript(fullText);
        return true;
      },
    });
  } else {
    console.error(`[inbound:${callId}] Deepgram not configured — live transcription unavailable`);
  }

  attachWsHandlers(ws, ctx, {
    callId,
    logPrefix: "inbound",
    agent,
    dgConnection,
    onStartMessage: async (msg) => {
      try {
        await Call.findByIdAndUpdate(callId, { twilioCallSid: msg.callSid });
      } catch {}

      patientIdentifyTimeout = setTimeout(async () => {
        if (!patientIdentified && ctx.connectionAlive) {
          identifyAttempts++;
          if (identifyAttempts >= 2) {
            const text = "I'm sorry, I wasn't able to find you in our system. Please call back during business hours.";
            agent.addToHistory("assistant", text);
            agent.callbacks.onResponse(text);
            await agent.synthesizeSpeech(text);
            setTimeout(() => {
              ctx.connectionAlive = false;
              ws.close();
            }, 3000);
          } else {
            const text = "I didn't catch that. Could you please tell me your full name again?";
            agent.addToHistory("assistant", text);
            agent.callbacks.onResponse(text);
            await agent.synthesizeSpeech(text);
          }
        }
      }, 15000);
    },
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
            patientContext: buildPatientInfo(patientForCall),
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
    if (patientIdentifyTimeout) {
      clearTimeout(patientIdentifyTimeout);
      patientIdentifyTimeout = null;
    }
    if (dgConnection) {
      try { dgConnection.requestClose(); dgConnection.disconnect(); } catch {}
    }
    ctx.connectionAlive = false;
  }
}

async function handlePatientIdentification(text, callId, agent) {
  const name = text.trim().toLowerCase();
  identifyAttempts++;

  try {
    const patients = await Patient.find({}).populate("organization", "name").limit(20);
    let match = null;

    for (const p of patients) {
      const pName = (p.name || "").toLowerCase().trim();
      if (pName.includes(name) || name.includes(pName)) {
        match = p;
        break;
      }
    }

    if (match) {
      patientIdentified = true;
      patientForCall = match;
      patientName = match.name;

      agent.patientName = match.name;
      agent.patientInfo = buildPatientInfo(match);
      enrichPatientInfoWithAppointments(match._id, agent.patientInfo).then((enriched) => { agent.patientInfo = enriched; });

      try {
        const patientForQ = await Patient.findById(match._id);
        const spec = patientForQ?.specialty || "general";
        const clinicType = patientForQ?.patientType || "human";
        const transcriptSoFar = agent.transcript?.join(" ") || "";
        const result = getQuestionsForCall(spec, clinicType, transcriptSoFar);
        if (result.questions && result.questions.length > 0) {
          agent.questions = result.questions;
          if (result.condition) {
            agent.conditionKey = result.condition;
            agent.conditionName = result.template;
          }
        } else {
          const defaultQ = await Questionnaire.findOne({ isDefault: true }) || await Questionnaire.findOne({}).sort({ createdAt: -1 });
          if (defaultQ?.questions) {
            agent.questions = defaultQ.questions.map((q) => (typeof q === "string" ? q : q.text));
          }
        }
      } catch {}

      await Call.findByIdAndUpdate(callId, {
        patient: match._id,
        organization: match.organization || null,
        language: match.language || "en",
      });

      try {
        const callDoc = await Call.findById(callId).populate("patient");
        if (callDoc) notifyForCall(callDoc);
      } catch {}

      const confirmation = `I found you, ${match.name}. Thank you. Let me begin your health checkup.`;
      agent.addToHistory("assistant", confirmation);
      agent.callbacks.onResponse(confirmation);
      await agent.synthesizeSpeech(confirmation);

      agent.addToHistory("assistant", "The patient has been identified. Now proceed with the health checkup questions one at a time.");
    } else if (identifyAttempts >= 2) {
      const msg = "I'm sorry, I wasn't able to find you in our system. Please call back during business hours or speak with your provider to ensure your information is up to date.";
      agent.addToHistory("assistant", msg);
      agent.callbacks.onResponse(msg);
      await agent.synthesizeSpeech(msg);
      setTimeout(() => {
        if (agent.ws?.readyState === agent.ws?.OPEN) {
          agent.ws.close();
        }
      }, 3000);
    } else {
      const msg = "I didn't find a match. Could you please spell your full name for me?";
      agent.addToHistory("assistant", msg);
      agent.callbacks.onResponse(msg);
      await agent.synthesizeSpeech(msg);
    }
  } catch (error) {
    console.error(`[inbound:${callId}] Patient identification error:`, error.message);
  }
}
