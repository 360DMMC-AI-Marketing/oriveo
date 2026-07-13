import { createVoiceAgent } from "./voiceAgent.js";
import { queryKnowledgeBase } from "./knowledgeBase.js";
import { handleFunctionCall, voiceFunctions } from "../routes/voice.js";
import Call from "../models/Call.js";
import { TriageEngine } from "./triageEngine.js";
import { EmotionAnalyzer } from "./emotionAnalyzer.js";
import { createLiveTranscription } from "./deepgram.js";
import { registerCall, removeCall, persistCallEvent } from "./callOrchestrator.js";
import {
  createStreamState, createSharedCallbacks, attachDeepgramHandlers,
  attachWsHandlers, saveTranscript as sharedSaveTranscript, getTwilioClient,
} from "./mediaStreamCommon.js";

const twilioClient = getTwilioClient();

export async function handleMediaStream(ws, req) {
  const callId = req.params.callId;
  const ctx = createStreamState();

  let language = "en";
  let patientName = "";
  let patientInfo = "";
  let questions = [];
  let multiLangEnabled = true;

  try {
    const call = await Call.findById(callId).populate("patient").populate("questionnaire");
    if (call) {
      language = call.language || "en";
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

      if (call.questionnaire?.questions) {
        questions = call.questionnaire.questions.map((q) => (typeof q === "string" ? q : q.text));
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
    practiceName: process.env.PRACTICE_NAME || "your healthcare provider",
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
      await sharedSaveTranscript(callId, agent.conversationHistory);
    },
  });

  function cleanup() {
    agent.reset();
    removeCall(callId);
    if (dgConnection) {
      try { dgConnection.requestClose(); dgConnection.disconnect(); } catch {}
    }
    ctx.connectionAlive = false;
  }
}
