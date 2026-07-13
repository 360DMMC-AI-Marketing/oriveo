import OpenAI from "openai";
import { getLanguageConfig } from "../config/languages.js";
import { TriageEngine } from "./triageEngine.js";
import { EmotionAnalyzer } from "./emotionAnalyzer.js";
import { withRetry } from "./queue.js";

let openai = null;

function getOpenAI() {
  if (!openai && process.env.OPENAI_API_KEY) {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openai;
}

const MEDICAL_SYSTEM_PROMPT = `You are a warm, compassionate medical assistant calling a patient on behalf of their healthcare provider — like an experienced nurse who has been in practice for years. Your entire purpose is to have a natural, human conversation that feels exactly like a real doctor-patient phone call.

CORE PERSONALITY:
- You speak with natural warmth and kindness, like a trusted healthcare provider
- You are professional but never cold or clinical
- You use natural spoken language, never bullet points or numbered lists aloud
- You show genuine concern when patients share worries or symptoms
- You adapt your tone to match the patient's emotional state — gentle if they're scared, calm if they're anxious, clear if they're confused
- You never sound like a robot, a script, or a survey
- You are calling the patient — so start with a warm greeting and introduce yourself

HOW YOU TALK (use these naturally, like a real person):
- Begin the call warmly: "Hello, am I speaking with [patient name]? This is [your name] calling from your doctor's office."
- "I'm doing a routine check-in today. Mind if I ask you a few questions?"
- "I hear you, and I'm glad you told me about that."
- "I can understand why that would be concerning."
- "Thank you for sharing that with me — that's really helpful to know."
- "I'm sorry you're going through that. Let's figure this out together."
- React to the patient's answers naturally before moving to the next topic
- Use contractions: "I'm", "you're", "that's", "don't", "can't", "it's"
- Ask one question at a time. Let the patient answer fully before moving on.
- Keep responses conversational, 2-3 sentences usually enough.
- End the call warmly: "Thank you for your time. We'll take it from here. Have a great day!"

QUESTIONNAIRE FLOW:
- You have a list of questions to complete during the call
- Weave them into the conversation naturally, like a doctor working through a list
- React to each answer before asking the next question
- Never ask multiple questions at once
- If the patient gives a short answer, follow up naturally before the next question

MEDICAL CONDUCT:
- Ask about symptoms, health status, and recovery progress
- Listen carefully and follow up on what the patient tells you
- Never provide definitive medical diagnoses
- Never prescribe or recommend specific medications
- Escalate any safety concerns immediately`;

const VETERINARY_SYSTEM_PROMPT = `You are a warm, compassionate veterinary assistant calling a pet owner on behalf of their veterinary clinic. You are like an experienced veterinary technician who has worked with animals for years — caring, reassuring, and professional.

CORE PERSONALITY:
- You speak with natural warmth and kindness, always putting the pet's wellbeing first
- You refer to the pet by name and treat them as a beloved family member
- You are professional but never cold or clinical
- You show genuine concern when owners share worries about their pets
- You adapt your tone to match the owner's emotional state
- You never sound like a robot or a script

HOW YOU TALK:
- "Hello, am I speaking with [owner name]? This is [your name] calling from [clinic name] regarding [pet name]."
- "I'm doing a routine check-in on [pet name] today."
- "How is [pet name] doing since their last visit?"
- "I hear you, and I'm glad you told me about that. Let me make a note of it."
- "I can understand why that would be concerning. Let's talk through what's going on."
- Use contractions and natural speech
- Ask one question at a time
- End: "Give [pet name] a good scratch from us. Thank you for your time!"

VETERINARY CONDUCT:
- Ask about appetite, energy, behavior, medication compliance
- Listen carefully and follow up on what the owner tells you
- Never provide definitive medical diagnoses or prescribe treatments
- Escalate any safety concerns — if a pet seems in crisis, advise emergency vet visit
- Always note species-specific concerns (e.g., dogs can't eat certain things, cats hide pain)`;

const GENERAL_SYSTEM_PROMPT = `You are a warm, intelligent AI voice assistant — like a capable personal assistant who handles calls professionally and naturally. You can manage any type of call: customer support, sales, surveys, reminders, appointments, or general information.

CORE PERSONALITY:
- You speak with natural warmth and professionalism
- You are friendly but never overly familiar
- You use natural spoken language, never bullet points or numbered lists aloud
- You adapt your tone to match the person you're speaking with
- You never sound like a robot, a script, or a survey
- You are calling the person — so start with a warm greeting and introduce yourself

HOW YOU TALK (use these naturally, like a real person):
- Begin the call warmly: "Hello, am I speaking with [name]? This is [your name] calling on behalf of [organization]."
- "How are you doing today? I appreciate you taking the time to speak with me."
- "That's really helpful, thank you for sharing that."
- "I understand, and I can certainly help with that."
- "Thank you — let me make a note of that."
- React to answers naturally before moving to the next topic
- Use contractions: "I'm", "you're", "that's", "don't", "can't", "it's"
- Ask one question at a time. Let the person answer fully before moving on.
- Keep responses conversational, 2-3 sentences usually enough.
- End the call warmly: "Thank you so much for your time. Have a wonderful day!"

CONVERSATION FLOW:
- There may be a list of questions or topics to cover during the call
- Weave them into the conversation naturally
- React to each answer before asking the next question
- Never ask multiple questions at once
- If the person gives a short answer, follow up naturally before the next question

GENERAL CONDUCT:
- Listen carefully and follow up on what the person tells you
- If asked something you don't know, be honest but helpful
- Never make up information — offer to connect them with someone who can help
- If the person becomes upset or frustrated, stay calm and empathetic
- Know when to end the call politely`;

export { MEDICAL_SYSTEM_PROMPT, VETERINARY_SYSTEM_PROMPT, GENERAL_SYSTEM_PROMPT };

export class VoiceAgent {
  constructor(options = {}) {
    if (options.systemPrompt) {
      this.systemPrompt = options.systemPrompt;
    } else if (options.type === "veterinary") {
      this.systemPrompt = VETERINARY_SYSTEM_PROMPT;
    } else if (options.type === "general") {
      this.systemPrompt = GENERAL_SYSTEM_PROMPT;
    } else {
      this.systemPrompt = MEDICAL_SYSTEM_PROMPT;
    }
    this.knowledgeBase = options.knowledgeBase || null;
    this.functions = options.functions || [];
    this.onFunctionCall = options.onFunctionCall || null;
    this.language = options.language || "en";
    this.langConfig = getLanguageConfig(this.language);
    this.conversationHistory = [];
    this.isSpeaking = false;
    this.interruptBuffer = "";
    this.triageEngine = options.triageEngine || new TriageEngine({ language: this.language });
    this.emotionAnalyzer = options.emotionAnalyzer || new EmotionAnalyzer();
    this.questions = options.questions || [];
    this.patientName = options.patientName || "";
    this.patientInfo = options.patientInfo || "";
    this.practiceName = options.practiceName || process.env.PRACTICE_NAME || "your healthcare provider";
    this.callStarted = false;
    this.identityVerified = false;
    this.consentRecorded = false;
    this.doNotCallRequested = false;
    this.languageDetected = false;
    this.detectedLanguage = null;

    this.onPersistEvent = options.onPersistEvent || (() => {});
    this.onPersistTranscript = options.onPersistTranscript || (() => {});

    this.callbacks = {
      onTranscript: options.onTranscript || (() => {}),
      onResponse: options.onResponse || (() => {}),
      onAudio: options.onAudio || (() => {}),
      onInterrupt: options.onInterrupt || (() => {}),
      onError: options.onError || (() => {}),
      onFunctionExecuted: options.onFunctionExecuted || (() => {}),
      onTriageEscalation: options.onTriageEscalation || (() => {}),
      onEmergency: options.onEmergency || (() => {}),
      onEmotionUpdate: options.onEmotionUpdate || (() => {}),
      onSpeakingStart: options.onSpeakingStart || (() => {}),
      onSpeakingEnd: options.onSpeakingEnd || (() => {}),
      onLanguageDetected: options.onLanguageDetected || (() => {}),
    };

    if (options.triageEngine) {
      this.triageEngine.callbacks.onTierChange = (data) => {
        this.callbacks.onTriageEscalation(data);
      };
      this.triageEngine.callbacks.onEmergency = (data) => {
        this.callbacks.onEmergency(data);
      };
    }
  }

  switchLanguage(langCode) {
    if (this.language === langCode && this.languageDetected) return;
    this.language = langCode;
    this.langConfig = getLanguageConfig(langCode);
    this.languageDetected = true;
    this.detectedLanguage = langCode;
    console.log(`[VoiceAgent] Switched language to ${langCode}`);
  }

  getSystemLanguageInstruction() {
    if (!this.languageDetected || this.language === "en") return "";
    const langName = this.langConfig.openaiLanguage || this.language;
    return `IMPORTANT: The patient speaks ${langName}. You MUST respond in ${langName}. Never switch to English. Use ${langName} medical terminology naturally.`;
  }

  async startCall() {
    if (this.callStarted) return;
    this.callStarted = true;

    const patientContext = this.patientInfo
      ? `Patient details: ${this.patientInfo}`
      : "";

    const messages = [
      { role: "system", content: this.systemPrompt },
    ];

    if (!this.languageDetected) {
      messages.push({
        role: "system",
        content: "Start the call in English. If the patient responds in another language, switch to their language. Ask once if unsure.",
      });
    }

    if (this.patientName) {
      messages.push({
        role: "system",
        content: `The patient you are calling is named ${this.patientName}. Greet them by name when the call starts.`,
      });
    }

    messages.push({
      role: "system",
      content: `You are calling from "${this.practiceName}". Always identify yourself and the practice name when greeting the patient.`,
    });

    const langInstruction = this.getSystemLanguageInstruction();
    if (langInstruction) {
      messages.push({ role: "system", content: langInstruction });
    }

    if (patientContext) {
      messages.push({ role: "system", content: patientContext });
    }

    if (this.questions.length > 0) {
      messages.push({
        role: "system",
        content: `You have a questionnaire to complete during this call. Ask these questions one at a time, weaving them naturally into the conversation. React to each answer before asking the next:\n${this.questions.map((q, i) => `${i + 1}. ${q}`).join("\n")}`,
      });
    }

    const client = getOpenAI();
    if (!client) {
      this.callbacks.onError("OpenAI not configured");
      return;
    }

    try {
      const responseText = await withRetry("ai-chat", async () => {
        const response = await client.chat.completions.create({
          model: "gpt-4o-mini",
          messages,
          temperature: 0.7,
          max_tokens: 250,
        });
        return response.choices[0]?.message?.content;
      }, { retries: 2, backoff: 500 });
      if (!responseText) return;

      this.addToHistory("assistant", responseText);
      this.callbacks.onResponse(responseText);
      await this.synthesizeSpeech(responseText);
    } catch (error) {
      this.callbacks.onError(error.message);
    }
  }

  addToHistory(role, content) {
    this.conversationHistory.push({ role, content });
    this.onPersistTranscript(role, content);
    if (this.conversationHistory.length > 50) {
      this.conversationHistory = this.conversationHistory.slice(-50);
    }
  }

  async processTranscript(text) {
    if (!text.trim()) return;

    const triageResult = this.triageEngine.screenUtterance(text);

    if (triageResult.escalated && triageResult.actions) {
      if (triageResult.actions.stopNormalFlow) {
        this.callbacks.onTriageEscalation(triageResult);

        if (triageResult.isCrisis) {
          const crisisScript = this.triageEngine.getCrisisScript();
          this.addToHistory("assistant", crisisScript);
          this.callbacks.onResponse(crisisScript);
          await this.synthesizeSpeech(crisisScript);
          return;
        }

        if (triageResult.tier === 0) {
          const emergencyScript = this.triageEngine.getEmergencyScript();
          this.addToHistory("assistant", emergencyScript);
          this.callbacks.onResponse(emergencyScript);
          await this.synthesizeSpeech(emergencyScript);

          this.callbacks.onEmergency({
            tier: 0,
            text,
            redFlags: triageResult.redFlags,
            timestamp: Date.now(),
          });
          return;
        }

        if (triageResult.tier === 1) {
          const urgentMsg = "I understand this concerns you. I'm going to make sure a nurse calls you today to follow up.";
          this.addToHistory("assistant", urgentMsg);
          this.callbacks.onResponse(urgentMsg);
          await this.synthesizeSpeech(urgentMsg);
          return;
        }
      }
    }

    const emotionResult = this.emotionAnalyzer.analyze(text);
    if (emotionResult.emotionalState.primary !== "neutral" || emotionResult.painLevel) {
      this.callbacks.onEmotionUpdate(emotionResult);
    }

    this.addToHistory("user", text);
    this.callbacks.onTranscript(text);

    const context = this.knowledgeBase
      ? await this.knowledgeBase.query(text)
      : null;

    const triageInsert = this.triageEngine.getSystemPromptInsert();
    const emotionInsert = this.emotionAnalyzer.getSystemPromptInsert();
    const responseGuidance = this.emotionAnalyzer.getResponseGuidance();

    const messages = [
      { role: "system", content: this.systemPrompt },
    ];

    if (!this.languageDetected) {
      messages.push({
        role: "system",
        content: "Listen to the patient's language. If they speak a language other than English, switch to that language now and continue in it.",
      });
    }

    if (this.patientName) {
      messages.push({
        role: "system",
        content: `The patient you are calling is named ${this.patientName}. Greet them by name when the call starts.`,
      });
    }

    messages.push({
      role: "system",
      content: `You represent "${this.practiceName}". Always identify yourself and the practice name when speaking to the patient.`,
    });

    const langInstruction = this.getSystemLanguageInstruction();
    if (langInstruction) {
      messages.push({ role: "system", content: langInstruction });
    }

    if (triageInsert) {
      messages.push({ role: "system", content: triageInsert });
    }

    if (emotionInsert) {
      messages.push({ role: "system", content: emotionInsert });
    }

    if (responseGuidance) {
      messages.push({ role: "system", content: responseGuidance });
    }

    if (this.questions.length > 0) {
      messages.push({
        role: "system",
        content: `You have a questionnaire to complete. Ask these questions one at a time, waiting for the patient's answer after each. Do not ask them all at once:\n${this.questions.map((q, i) => `${i + 1}. ${q}`).join("\n")}`,
      });
    }

    if (context) {
      messages.push({
        role: "system",
        content: `Relevant context from knowledge base:\n${context}`,
      });
    }

    for (const msg of this.conversationHistory.slice(-10)) {
      messages.push(msg);
    }

    const client = getOpenAI();
    if (!client) {
      this.callbacks.onError("OpenAI not configured");
      return;
    }

    try {
      const response = await withRetry("ai-chat", () => client.chat.completions.create({
        model: "gpt-4o-mini",
        messages,
        temperature: 0.7,
        max_tokens: 250,
        tools: this.functions.length > 0
          ? this.functions.map((fn) => ({
              type: "function",
              function: {
                name: fn.name,
                description: fn.description,
                parameters: fn.parameters,
              },
            }))
          : undefined,
        tool_choice: "auto",
      }), { retries: 2, backoff: 500 });

      const choice = response.choices[0];
      const message = choice.message;

      if (message.tool_calls && message.tool_calls.length > 0) {
        for (const toolCall of message.tool_calls) {
          const fnName = toolCall.function.name;
          const fnArgs = JSON.parse(toolCall.function.arguments);
          const fnDef = this.functions.find((f) => f.name === fnName);
          if (fnDef && this.onFunctionCall) {
            const result = await this.onFunctionCall(fnName, fnArgs);
            this.callbacks.onFunctionExecuted({ name: fnName, args: fnArgs, result });
            this.addToHistory("assistant", `[Called function: ${fnName}]`);
          }
        }
        return;
      }

      const responseText = message.content;
      if (!responseText) return;

      this.addToHistory("assistant", responseText);
      this.callbacks.onResponse(responseText);

      await this.synthesizeSpeech(responseText);
    } catch (error) {
      this.callbacks.onError(error.message || "AI response failed");
    }
  }

  async synthesizeSpeech(text) {
    if (!process.env.ELEVENLABS_API_KEY) {
      this.callbacks.onError("ElevenLabs not configured");
      return;
    }

    this.isSpeaking = true;
    this.callbacks.onSpeakingStart();

    const voiceId = this.langConfig.elevenLabsVoiceId || process.env.ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM";
    const modelId = this.langConfig.elevenLabsModel || "eleven_turbo_v2_5";

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
            model_id: modelId,
            voice_settings: {
              stability: 0.4,
              similarity_boost: 0.8,
              optimize_streaming_latency: 4,
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`TTS failed: ${response.statusText}`);
      }

      const audioBuffer = Buffer.from(await response.arrayBuffer());
      this.callbacks.onAudio(audioBuffer);
    } catch (error) {
      this.callbacks.onError(error.message);
    } finally {
      this.isSpeaking = false;
      this.callbacks.onSpeakingEnd();
    }
  }

  handleInterruption() {
    this.isSpeaking = false;
    this.interruptBuffer = "";
    this.callbacks.onInterrupt();
  }

  reset() {
    this.conversationHistory = [];
    this.isSpeaking = false;
    this.interruptBuffer = "";
    this.emotionAnalyzer.reset();
    this.callStarted = false;
  }
}

export function createVoiceAgent(options = {}) {
  return new VoiceAgent(options);
}
