import twilio from "twilio";
import Call from "../models/Call.js";
import Patient from "../models/Patient.js";
import { scoreCall } from "./qaScoring.js";
import { persistCallEvent, persistTranscriptEntry } from "./callOrchestrator.js";
import { notifyForCall } from "./notificationService.js";
import { getIo } from "./socketManager.js";
import { detectLanguageFromDeepgram } from "../config/languages.js";
import { getSpecialtyForKeywords, SPECIALTY_TEMPLATES } from "../config/specialtyTemplates.js";

export function splitAudio(base64, chunkSize) {
  const chunks = [];
  for (let i = 0; i < base64.length; i += chunkSize) {
    chunks.push(base64.slice(i, i + chunkSize));
  }
  return chunks;
}

export function getTwilioClient() {
  if (process.env.TWILIO_ACCOUNT_SID) {
    return twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  }
  return null;
}

export function buildPatientInfo(patient) {
  const p = patient || {};
  const age = p.dob ? Math.floor((new Date() - new Date(p.dob)) / 31557600000) : null;
  const parts = [];
  if (p.name) parts.push(`Name: ${p.name}`);
  if (age) parts.push(`Age: ${age}`);
  if (p.gender) parts.push(`Gender: ${p.gender}`);
  if (p.primaryDiagnosis) parts.push(`Diagnosis: ${p.primaryDiagnosis}`);
  if (p.chronicConditions) parts.push(`Chronic conditions: ${p.chronicConditions}`);
  if (p.currentMedications) parts.push(`Medications: ${p.currentMedications}`);
  if (p.allergies) parts.push(`Allergies: ${p.allergies}`);
  if (p.medicalNotes) parts.push(`Notes: ${p.medicalNotes}`);
  return parts.join(". ");
}

export async function getTransferAudio(text) {
  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${process.env.ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM"}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "xi-api-key": process.env.ELEVENLABS_API_KEY },
        body: JSON.stringify({
          text,
          model_id: "eleven_turbo_v2_5",
          voice_settings: { stability: 0.5, similarity_boost: 0.75 },
        }),
      }
    );
    if (!response.ok) throw new Error(`TTS HTTP ${response.status}`);
    return Buffer.from(await response.arrayBuffer()).toString("base64");
  } catch (err) {
    console.error("Transfer audio failed:", err.message);
    return null;
  }
}

export async function saveTranscript(callId, history, options = {}) {
  const { fhirPatientCheck } = options;
  try {
    const call = await Call.findById(callId).populate("patient");
    if (!call) return;

    const transcript = [];
    for (const entry of history) {
      if (entry.role === "user") {
        const lastEntry = transcript[transcript.length - 1];
        if (lastEntry && !lastEntry.answer) {
          lastEntry.answer = entry.content;
          lastEntry.timestamp = Date.now();
        } else {
          transcript.push({ question: entry.content, answer: "", timestamp: Date.now() });
        }
      } else if (entry.role === "assistant") {
        const lastEntry = transcript[transcript.length - 1];
        if (lastEntry && lastEntry.answer === undefined) {
          lastEntry.answer = entry.content;
          lastEntry.timestamp = Date.now();
        } else {
          transcript.push({ question: entry.content, answer: "", timestamp: Date.now() });
        }
      }
    }

    const allText = transcript.map((t) => `${t.question} ${t.answer || ""}`).join(" ");
    const detectedSpecialty = getSpecialtyForKeywords(allText);
    if (detectedSpecialty) {
      call.detectedSpecialty = detectedSpecialty;
    }

    call.transcript = transcript;
    call.status = "completed";
    call.endedAt = new Date();
    if (call.startedAt) {
      call.duration = Math.floor((new Date() - call.startedAt) / 1000);
    }
    await call.save();

    try {
      const populated = await Call.findById(call._id).populate("patient");
      if (populated) notifyForCall(populated);
    } catch {}

    scoreCall(callId, transcript, call.aiSummary).then((result) => {
      if (!result.error) {
        Call.findByIdAndUpdate(callId, {
          qaScore: {
            scores: result.scores,
            overall: result.overall,
            strengths: result.strengths,
            weaknesses: result.weaknesses,
            summary: result.summary,
            scoredAt: new Date(),
          },
        }).catch((err) => console.error("QA score save error:", err.message));
      }
    }).catch((err) => console.error("QA scoring error:", err.message));

    if (process.env.FHIR_BASE_URL) {
      try {
        const { getFhirAdapter } = await import("./fhirAdapter.js");
        const fhir = getFhirAdapter();
        const hasPatient = fhirPatientCheck ? await fhirPatientCheck(call) : (call.patient ? true : false);
        if (hasPatient) {
          if (call.highestTier < 3 && call.redFlags?.length > 0) {
            await fhir.createObservation(call.patient, { code: "72166-2", display: "Triage risk level" }, `Tier ${call.highestTier} — ${call.redFlags.map(f => f.keyword).join(", ")}`);
          }
          if (call.highestTier <= 1) {
            await fhir.createCarePlan(call.patient, call);
          }
        }
      } catch (fhirError) {
        console.error(`FHIR sync error:`, fhirError.message);
      }
    }
  } catch (error) {
    console.error(`Save transcript error:`, error.message);
  }
}

export function createStreamState() {
  return {
    streamSid: null,
    connectionAlive: true,
    isAiSpeaking: false,
    isDgConnected: false,
    patientTranscriptBuffer: "",
    languageLocked: false,
    languageConfirmAsked: false,
    dgConnection: null,
  };
}

export function createSharedCallbacks(callId, ws, ctx, deps) {
  const {
    logPrefix = "",
    triageEngine,
    emotionAnalyzer,
    agent,
    getTwilioClientFn = getTwilioClient,
    onBeforeTriageEscalation,
    onBeforeEmergency,
    onBeforeProcessTranscript,
  } = deps;

  const pfx = logPrefix ? `[${logPrefix}:${callId}]` : `[${callId}]`;

  return {
    onPersistTranscript: async (role, content) => {
      persistTranscriptEntry(callId, role, content);
    },

    onTranscript: async (text) => {
      console.log(`${pfx} Patient: ${text}`);
      const io = getIo();
      if (io) io.to("supervisor-room").emit("call:transcript", { callId, role: "patient", text, timestamp: Date.now() });
    },

    onResponse: async (text) => {
      console.log(`${pfx} AI: ${text}`);
      const io = getIo();
      if (io) io.to("supervisor-room").emit("call:transcript", { callId, role: "ai", text, timestamp: Date.now() });
    },

    onAudio: async (audioBuffer) => {
      if (!ctx.streamSid || ws.readyState !== ws.OPEN || !ctx.connectionAlive) return;
      const base64Audio = audioBuffer.toString("base64");
      const messages = splitAudio(base64Audio, 3200);
      for (const mediaPayload of messages) {
        if (!ctx.connectionAlive || ws.readyState !== ws.OPEN) break;
        ws.send(JSON.stringify({
          event: "media",
          streamSid: ctx.streamSid,
          media: { payload: mediaPayload },
        }));
      }
    },

    onTriageEscalation: async (data) => {
      console.log(`${pfx} Triage escalation: Tier ${data.from} -> ${data.to}${data.isCrisis ? " (CRISIS)" : ""}`);
      persistCallEvent(callId, "triage", data);
      const io = getIo();
      if (io) io.to("supervisor-room").emit("call:severity", { callId, tier: data.to, from: data.from, isCrisis: !!data.isCrisis, timestamp: Date.now() });
      if (onBeforeTriageEscalation && !(await onBeforeTriageEscalation(data))) return;
      try {
        await Call.findByIdAndUpdate(callId, {
          triageTier: data.to,
          highestTier: Math.min(data.to, data.from),
          crisisPathwayUsed: data.isCrisis || false,
          $push: {
            redFlags: { $each: data.redFlags || [] },
            concerningStatements: {
              text: data.text || "",
              timestamp: Date.now(),
              flags: data.redFlags?.map((f) => f.keyword) || [],
            },
          },
        });
        if (data.to <= 1) {
          const callDoc = await Call.findById(callId).populate("patient", "name phone");
          if (callDoc?.patient) {
            const emotionData = emotionAnalyzer.getResult();
            if (data.to === 0) {
              const { sendEmergencyAlert } = await import("./alertService.js");
              sendEmergencyAlert(callId, callDoc.patient, triageEngine.redFlags, emotionData);
            } else {
              const { sendUrgentAlert } = await import("./alertService.js");
              sendUrgentAlert(callId, callDoc.patient, triageEngine.redFlags, emotionData);
            }
          }
        }
      } catch {}
    },

    onEmergency: async (data) => {
      console.log(`${pfx} EMERGENCY DETECTED: ${data.text}`);
      persistCallEvent(callId, "triage", { emergency: true, ...data });
      try {
        await Call.findByIdAndUpdate(callId, {
          triageTier: 0,
          escalationAction: data,
          emergencyDetected: true,
        });
        if (onBeforeEmergency && !(await onBeforeEmergency(data))) return;
        const callDoc = await Call.findById(callId).populate("patient", "name phone");
        if (callDoc?.patient) {
          const { sendEmergencyAlert } = await import("./alertService.js");
          sendEmergencyAlert(callId, callDoc.patient, triageEngine.redFlags, emotionAnalyzer.getResult());
          notifyForCall(callDoc);
        }
      } catch {}
    },

    onEmotionUpdate: async (emotionData) => {
      console.log(`${pfx} Emotion: ${emotionData.emotionalState.primary}${emotionData.painLevel ? `, pain: ${emotionData.painLevel}` : ""}`);
      persistCallEvent(callId, "emotion", emotionData);
      const io = getIo();
      if (io) io.to("supervisor-room").emit("call:emotion", { callId, emotion: emotionData.emotionalState.primary, painLevel: emotionData.painLevel, timestamp: Date.now() });
      try {
        await Call.findByIdAndUpdate(callId, {
          $set: {
            "emotionalState.primary": emotionData.emotionalState.primary,
            "emotionalState.intensity": emotionData.emotionalState.intensity,
            "emotionalState.painLevel": emotionData.painLevel,
          },
        });
      } catch {}
    },

    onLanguageDetected: async (langCode) => {
      console.log(`${pfx} Language detected: ${langCode}`);
      persistCallEvent(callId, "language_detected", { language: langCode });
    },

    onInterrupt: () => {
      if (ctx.streamSid && ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify({ event: "clear", streamSid: ctx.streamSid }));
      }
    },

    onFunctionExecuted: async (result) => {
      console.log(`${pfx} Function called: ${result.name}`);
      persistCallEvent(callId, "state_change", { function: result.name, args: result.args });
      if (result.result?.transfer) {
        const transferAudio = await getTransferAudio(
          logPrefix === "inbound"
            ? "Please hold while I transfer you to a human operator. Someone will be with you shortly."
            : "Please hold while I transfer you to a human operator."
        );
        if (transferAudio && ctx.streamSid && ws.readyState === ws.OPEN) {
          ws.send(JSON.stringify({
            event: "media",
            streamSid: ctx.streamSid,
            media: { payload: transferAudio },
          }));
        }
        const tClient = getTwilioClientFn();
        const humanNumber = process.env.HUMAN_TRANSFER_NUMBER;
        if (humanNumber && tClient) {
          setTimeout(async () => {
            try {
              const { getCall } = await import("./callOrchestrator.js");
              const callData = getCall(callId);
              if (callData?.callSid) {
                await tClient.calls(callData.callSid).update({
                  twiml: `<Response><Dial>${humanNumber}</Dial></Response>`,
                });
                console.log(`${pfx} Call transferred to ${humanNumber}`);
              }
            } catch (err) {
              console.error(`${pfx} Transfer error:`, err.message);
            }
          }, 3000);
        }
      }
      if (result.result?.endCall) {
        setTimeout(() => {
          ctx.connectionAlive = false;
          ws.close();
        }, 2000);
      }
    },

    onError: async (error) => {
      console.error(`${pfx} Error: ${error}`);
      persistCallEvent(callId, "error", { message: error });
      if (ws.readyState !== ws.OPEN || !ctx.streamSid) return;
      try {
        const fallbackText = "I apologize, but I'm having a temporary technical issue. A human operator will be with you shortly. Please hold.";
        const response = await fetch(
          `https://api.elevenlabs.io/v1/text-to-speech/${process.env.ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM"}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json", "xi-api-key": process.env.ELEVENLABS_API_KEY },
            body: JSON.stringify({
              text: fallbackText,
              model_id: "eleven_turbo_v2_5",
              voice_settings: { stability: 0.5, similarity_boost: 0.75 },
            }),
          }
        );
        if (response.ok) {
          const buffer = Buffer.from(await response.arrayBuffer());
          const chunks = splitAudio(buffer.toString("base64"), 16000);
          for (const chunk of chunks) {
            if (ws.readyState !== ws.OPEN) break;
            ws.send(JSON.stringify({ event: "media", streamSid: ctx.streamSid, media: { payload: chunk } }));
            await new Promise((r) => setTimeout(r, 40));
          }
        }
      } catch {}
    },

    onSpeakingStart: () => {
      ctx.isAiSpeaking = true;
    },

    onSpeakingEnd: () => {
      ctx.isAiSpeaking = false;
    },
  };
}

export function attachDeepgramHandlers(callId, dgConnection, ctx, deps) {
  const {
    logPrefix = "",
    agent,
    multiLangEnabled,
    language,
    onBeforeProcessTranscript,
  } = deps;

  const pfx = logPrefix ? `[${logPrefix}:${callId}]` : `[${callId}]`;

  dgConnection.on("open", () => {
    ctx.isDgConnected = true;
    console.log(`${pfx} Deepgram live connection opened (lang: ${language}, multi: ${multiLangEnabled})`);
  });

  dgConnection.on("Results", async (transcriptEvent) => {
    if (!ctx.connectionAlive) return;
    const transcript = transcriptEvent?.channel?.alternatives?.[0]?.transcript;
    if (!transcript?.trim()) return;

    const isFinal = transcriptEvent.is_final;
    const speechFinal = transcriptEvent.speech_final;
    const detectedLangs = transcriptEvent?.channel?.alternatives?.[0]?.languages;

    if (multiLangEnabled && !ctx.languageLocked && detectedLangs && detectedLangs.length > 0 && !ctx.languageConfirmAsked) {
      const detectedCode = detectLanguageFromDeepgram(detectedLangs);
      if (detectedCode && detectedCode !== "en") {
        ctx.languageLocked = true;
        ctx.languageConfirmAsked = true;
        agent.switchLanguage(detectedCode);
        agent.callbacks.onLanguageDetected(detectedCode);
        console.log(`${pfx} Auto-detected language: ${detectedCode}`);
        try {
          const configureMsg = JSON.stringify({ type: "Configure", language_hints: [detectedCode] });
          if (dgConnection && dgConnection.send) {
            dgConnection.send(configureMsg);
          }
        } catch {}
      }
    }

    if (speechFinal) {
      ctx.patientTranscriptBuffer += " " + transcript;
      const fullText = ctx.patientTranscriptBuffer.trim();
      ctx.patientTranscriptBuffer = "";

      if (ctx.isAiSpeaking) {
        agent.handleInterruption();
      }

      if (onBeforeProcessTranscript) {
        await onBeforeProcessTranscript(fullText);
      } else {
        agent.processTranscript(fullText);
      }
    } else if (isFinal) {
      ctx.patientTranscriptBuffer = transcript;
    }
  });

  dgConnection.on("UtteranceEnd", () => {
    if (!ctx.connectionAlive) return;
    if (ctx.patientTranscriptBuffer.trim()) {
      const fullText = ctx.patientTranscriptBuffer.trim();
      ctx.patientTranscriptBuffer = "";

      if (ctx.isAiSpeaking) {
        agent.handleInterruption();
      }

      if (onBeforeProcessTranscript) {
        onBeforeProcessTranscript(fullText);
      } else {
        agent.processTranscript(fullText);
      }
    }
  });

  dgConnection.on("SpeechStarted", () => {
    if (ctx.isAiSpeaking) {
      agent.handleInterruption();
    }
  });

  dgConnection.on("close", () => {
    ctx.isDgConnected = false;
    console.log(`${pfx} Deepgram connection closed`);
  });

  dgConnection.on("error", (error) => {
    console.error(`${pfx} Deepgram error:`, error);
    ctx.isDgConnected = false;
    persistCallEvent(callId, "error", { source: "deepgram", message: error.message || String(error) });
  });

  dgConnection.on("Warning", (warning) => {
    console.warn(`${pfx} Deepgram warning:`, warning);
  });
}

export function attachWsHandlers(ws, ctx, deps) {
  const {
    callId,
    logPrefix = "",
    agent,
    dgConnection,
    cleanup,
    onStartMessage,
  } = deps;

  const pfx = logPrefix ? `[${logPrefix}:${callId}]` : `[${callId}]`;

  ws.on("message", async (data) => {
    if (!ctx.connectionAlive) return;
    try {
      const msg = JSON.parse(data);

      switch (msg.event) {
        case "connected":
          console.log(`${pfx} Media stream connected`);
          break;

        case "start":
          ctx.streamSid = msg.streamSid;
          console.log(`${pfx} Stream started: ${ctx.streamSid}`);
          if (onStartMessage) await onStartMessage(msg);
          agent.startCall();
          break;

        case "media":
          if (msg.media?.payload && ctx.isDgConnected) {
            try {
              const audioBytes = Buffer.from(msg.media.payload, "base64");
              dgConnection.send(audioBytes);
            } catch (sendErr) {
              console.error(`${pfx} Deepgram send error:`, sendErr.message);
              ctx.isDgConnected = false;
            }
          }
          break;

        case "stop":
          console.log(`${pfx} Stream stopped`);
          ctx.connectionAlive = false;
          cleanup();
          break;

        default:
          break;
      }
    } catch (error) {
      console.error(`${pfx} Message error:`, error.message);
    }
  });

  ws.on("close", async () => {
    console.log(`${pfx} WebSocket closed`);
    ctx.connectionAlive = false;
    if (typeof deps.onWsClose === "function") {
      await deps.onWsClose();
    }
    cleanup();
  });

  ws.on("error", (error) => {
    console.error(`${pfx} WebSocket error:`, error.message);
    ctx.connectionAlive = false;
    persistCallEvent(callId, "error", { source: "websocket", message: error.message });
    cleanup();
  });
}
