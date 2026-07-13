import { createClient } from "@deepgram/sdk";
import OpenAI from "openai";
import { getLanguageConfig } from "../config/languages.js";
import { TriageEngine } from "./triageEngine.js";
import { EmotionAnalyzer } from "./emotionAnalyzer.js";
import { sendEmergencyAlert, sendUrgentAlert } from "./alertService.js";

let deepgram = null;
let openai = null;

function getDeepgram() {
  if (!deepgram && process.env.DEEPGRAM_API_KEY) {
    deepgram = createClient(process.env.DEEPGRAM_API_KEY);
  }
  return deepgram;
}

function getOpenAI() {
  if (!openai && process.env.OPENAI_API_KEY) {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openai;
}

const agents = new Map();

export function handleBrowserVoice(ws) {
  const agentId = `agent-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  let isActive = false;
  let conversationHistory = [];
  let audioBuffer = [];
  let language = "en";
  const triageEngine = new TriageEngine({ language });
  const emotionAnalyzer = new EmotionAnalyzer();

  const systemPrompt = `You are a warm, compassionate medical assistant — like an experienced nurse who truly cares about their patients.

HOW YOU TALK:
- You speak with natural warmth and kindness
- You use natural language, not bullet points or numbered lists
- You adapt your tone to match the patient's feelings
- "I hear you", "I understand why that's concerning", "Thank you for telling me"
- Use contractions: "I'm", "you're", "that's", "don't", "it's"
- Ask one question at a time. Keep responses 2-3 sentences.
- Never sound robotic or scripted

YOUR ROLE:
- Ask about symptoms, health status, and recovery progress
- Listen carefully and follow up on what the patient says
- Never give definitive medical diagnoses
- If unsure, say "Let me make sure a doctor reviews your question"
- Always respond in the same language the patient speaks to you.`;

  ws.on("message", async (data) => {
    try {
      const msg = JSON.parse(data);

      switch (msg.type) {
        case "start": {
          isActive = true;
          audioBuffer = [];
          language = msg.language || "en";
          const questions = msg.questions || [];
          conversationHistory = [
            { role: "system", content: systemPrompt },
            { role: "system", content: `The patient speaks ${getLanguageConfig(language).label}. Always respond in ${getLanguageConfig(language).label}.` },
            { role: "system", content: triageEngine.getSystemPromptInsert() },
          ];
          if (questions.length > 0) {
            conversationHistory.push({
              role: "system",
              content: `You have a questionnaire to complete. Ask these questions one at a time, waiting for the patient's answer after each. Do not ask them all at once:\n${questions.map((q, i) => `${i + 1}. ${q}`).join("\n")}`,
            });
          }
          ws.send(JSON.stringify({ type: "status", message: "AI agent ready" }));
          greetPatient(msg.patientName);
          break;
        }

        case "audio": {
          if (!isActive) return;
          audioBuffer.push(msg.data);
          if (audioBuffer.length >= 4) {
            const payload = audioBuffer.shift();
            processAudioInput(payload);
          }
          break;
        }

        case "stop": {
          isActive = false;
          ws.send(JSON.stringify({ type: "status", message: "Call ended" }));
          agents.delete(agentId);
          break;
        }
      }
    } catch (error) {
      ws.send(JSON.stringify({ type: "error", message: error.message }));
    }
  });

  ws.on("close", () => {
    isActive = false;
    agents.delete(agentId);
  });

  async function greetPatient(name) {
    const greeting = `Hello${name ? ` ${name}` : ""}! I'm your AI health assistant. How are you feeling today?`;
    conversationHistory.push({ role: "assistant", content: greeting });
    ws.send(JSON.stringify({ type: "response", text: greeting }));
    ws.send(JSON.stringify({ type: "speaking", speaking: true }));
    const audio = await synthesizeSpeech(greeting);
    if (audio) {
      ws.send(JSON.stringify({ type: "audio", data: audio }));
    }
    ws.send(JSON.stringify({ type: "speaking", speaking: false }));
  }

  async function processAudioInput(audioBase64) {
    const client = getDeepgram();
    if (!client) {
      ws.send(JSON.stringify({ type: "error", message: "Deepgram not configured" }));
      return;
    }

    try {
      const audioBytes = Buffer.from(audioBase64, "base64");
      const langConfig = getLanguageConfig(language);
      const { result } = await client.listen.prerecorded.transcribeFile(audioBytes, {
        model: "nova-2",
        language: langConfig.deepgram,
        smart_format: true,
      });
      const text = result?.results?.channels?.[0]?.alternatives?.[0]?.transcript || "";
      if (!text.trim()) return;

      ws.send(JSON.stringify({ type: "transcript", text }));

      // Analyze emotion and pain before triage (for richer alerts)
      const emotionResult = emotionAnalyzer.analyze(text);

      const triageResult = triageEngine.screenUtterance(text);
      if (triageResult.escalated && triageResult.actions) {
        if (triageResult.actions.stopNormalFlow) {
          ws.send(JSON.stringify({ type: "status", message: `Triage Tier ${triageResult.tier}` }));

          if (triageResult.isCrisis) {
            const crisisScript = triageEngine.getCrisisScript();
            conversationHistory.push({ role: "assistant", content: crisisScript });
            ws.send(JSON.stringify({ type: "response", text: crisisScript }));
            ws.send(JSON.stringify({ type: "speaking", speaking: true }));
            const audio = await synthesizeSpeech(crisisScript);
            if (audio) ws.send(JSON.stringify({ type: "audio", data: audio }));
            ws.send(JSON.stringify({ type: "speaking", speaking: false }));
            sendEmergencyAlert(agentId, { name: "Browser Caller", phone: "N/A (browser call)" }, triageEngine.redFlags, emotionAnalyzer.getResult());
            return;
          }

          if (triageResult.tier === 0) {
            const emergencyScript = triageEngine.getEmergencyScript();
            conversationHistory.push({ role: "assistant", content: emergencyScript });
            ws.send(JSON.stringify({ type: "response", text: emergencyScript }));
            ws.send(JSON.stringify({ type: "speaking", speaking: true }));
            const audio = await synthesizeSpeech(emergencyScript);
            if (audio) ws.send(JSON.stringify({ type: "audio", data: audio }));
            ws.send(JSON.stringify({ type: "speaking", speaking: false }));
            sendEmergencyAlert(agentId, { name: "Browser Caller", phone: "N/A (browser call)" }, triageEngine.redFlags, emotionAnalyzer.getResult());
            return;
          }

          if (triageResult.tier === 1) {
            const urgentMsg = "I understand this concerns you. I'm going to make sure a nurse calls you today to follow up.";
            conversationHistory.push({ role: "assistant", content: urgentMsg });
            ws.send(JSON.stringify({ type: "response", text: urgentMsg }));
            ws.send(JSON.stringify({ type: "speaking", speaking: true }));
            const audio = await synthesizeSpeech(urgentMsg);
            if (audio) ws.send(JSON.stringify({ type: "audio", data: audio }));
            ws.send(JSON.stringify({ type: "speaking", speaking: false }));
            sendUrgentAlert(agentId, { name: "Browser Caller", phone: "N/A (browser call)" }, triageEngine.redFlags, emotionAnalyzer.getResult());
            return;
          }
        }
      }

      // Emotion context for LLM
      const emotionInsert = emotionAnalyzer.getSystemPromptInsert();
      const responseGuidance = emotionAnalyzer.getResponseGuidance();

      const triageInsert = triageEngine.getSystemPromptInsert();

      conversationHistory.push({ role: "user", content: text });

      const aiClient = getOpenAI();
      if (!aiClient) return;

      const systemMessages = [
        { role: "system", content: systemPrompt },
        { role: "system", content: triageInsert },
      ];
      if (emotionInsert) {
        systemMessages.push({ role: "system", content: emotionInsert });
      }
      if (responseGuidance) {
        systemMessages.push({ role: "system", content: responseGuidance });
      }
      const messages = [...systemMessages, ...conversationHistory.slice(-10)];
      const completion = await aiClient.chat.completions.create({
        model: "gpt-4o-mini",
        messages,
        temperature: 0.7,
        max_tokens: 150,
      });

      const responseText = completion.choices[0].message.content;
      if (responseText) {
        conversationHistory.push({ role: "assistant", content: responseText });
        ws.send(JSON.stringify({ type: "response", text: responseText }));
        ws.send(JSON.stringify({ type: "speaking", speaking: true }));
        const audio = await synthesizeSpeech(responseText);
        if (audio) {
          ws.send(JSON.stringify({ type: "audio", data: audio }));
        }
        ws.send(JSON.stringify({ type: "speaking", speaking: false }));
      }
    } catch (error) {
      ws.send(JSON.stringify({ type: "error", message: error.message }));
    }
  }

  async function synthesizeSpeech(text) {
    if (!process.env.ELEVENLABS_API_KEY) return null;
    const langConfig = getLanguageConfig(language);
    const voiceId = langConfig.elevenLabsVoiceId || process.env.ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM";
    try {
      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "xi-api-key": process.env.ELEVENLABS_API_KEY,
          },
          body: JSON.stringify({
            text,
            model_id: langConfig.elevenLabsModel || "eleven_turbo_v2_5",
            voice_settings: {
              stability: 0.4,
              similarity_boost: 0.8,
              optimize_streaming_latency: 4,
            },
          }),
        }
      );
      if (!response.ok) return null;
      const buffer = Buffer.from(await response.arrayBuffer());
      return buffer.toString("base64");
    } catch {
      return null;
    }
  }
}
