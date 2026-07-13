const EMOTION_PATTERNS = {
  anxiety: {
    keywords: ["nervous", "worried", "anxious", "scared", "afraid", "panicking", "panic", "frightened", "uneasy", "dread", "terrified", "can't stop thinking", "overthinking", "what if", "i'm worried", "i'm scared", "i'm nervous"],
    weight: 1,
  },
  fear: {
    keywords: ["terrified", "horrified", "petrified", "afraid something is wrong", "scared it's serious", "fear", "scared of", "afraid of", "i'm dying", "i'm going to die", "something bad", "worst case"],
    weight: 2,
  },
  frustration: {
    keywords: ["frustrated", "annoyed", "tired of", "fed up", "sick of", "this isn't working", "nothing helps", "useless", "waste of time", "not helping", "why bother", "can't deal with this anymore"],
    weight: 1,
  },
  sadness: {
    keywords: ["sad", "depressed", "down", "miserable", "hopeless", "lonely", "crying", "sorrow", "grief", "heartbroken", "empty", "numb", "no joy", "can't enjoy", "no point", "nothing matters", "tearful"],
    weight: 1.5,
  },
  anger: {
    keywords: ["angry", "mad", "furious", "irritated", "upset", "pissed", "enraged", "livid", "frustrating", "infuriated", "can't stand", "sick and tired"],
    weight: 1.5,
  },
  confusion: {
    keywords: ["confused", "don't understand", "not sure", "confusing", "unclear", "what does that mean", "i don't get it", "i'm lost", "can you explain", "too complicated", "no idea", "not making sense", "i don't know what to do"],
    weight: 1,
  },
  distress: {
    keywords: ["can't breathe", "help me", "please help", "something's wrong", "i'm not okay", "i need help", "i can't do this", "i can't handle", "too much", "overwhelming", "overwhelmed", "desperate", "can't cope"],
    weight: 3,
  },
};

const PAIN_PATTERNS = {
  numeric: /\b(\d+)\s*(?:\/|\s*out\s*of\s*)?\s*10\b/i,
  severe: {
    keywords: ["agonizing", "excruciating", "unbearable", "worst pain", "severe pain", "intense pain", "crippling", "debilitating", "can't move", "screaming", "pain is 10", "pain is 9", "pain is 8"],
    level: "severe",
  },
  moderate: {
    keywords: ["moderate pain", "hurts quite a bit", "pain is 5", "pain is 6", "pain is 7", "sore", "aching", "throbbing", "pulling", "stiff", "discomfort"],
    level: "moderate",
  },
  mild: {
    keywords: ["mild pain", "little pain", "slight pain", "pain is 1", "pain is 2", "pain is 3", "pain is 4", "a little sore", "a bit uncomfortable", "minor", "barely hurts"],
    level: "mild",
  },
};

export class EmotionAnalyzer {
  constructor() {
    this.emotionalState = { primary: "neutral", secondary: [], intensity: 0 };
    this.painLevel = null;
    this.distressDetected = false;
    this.history = [];
  }

  analyze(text) {
    if (!text || !text.trim()) return this.getResult();

    const lower = text.toLowerCase();
    const detectedEmotions = [];
    let maxWeight = 0;
    let primary = "neutral";

    for (const [emotion, config] of Object.entries(EMOTION_PATTERNS)) {
      const matchCount = config.keywords.filter((kw) => lower.includes(kw)).length;
      if (matchCount > 0) {
        const weightedScore = matchCount * config.weight;
        detectedEmotions.push({ emotion, score: weightedScore, count: matchCount });
        if (weightedScore > maxWeight) {
          maxWeight = weightedScore;
          primary = emotion;
        }
      }
    }

    if (primary === "distress") {
      this.distressDetected = true;
    }

    let painLevel = null;
    const numericMatch = lower.match(PAIN_PATTERNS.numeric);
    if (numericMatch) {
      const num = parseInt(numericMatch[1], 10);
      if (num >= 8) painLevel = "severe";
      else if (num >= 5) painLevel = "moderate";
      else if (num >= 1) painLevel = "mild";
    } else {
      for (const [, config] of Object.entries(PAIN_PATTERNS)) {
        if (config.level && config.keywords.some((kw) => lower.includes(kw))) {
          painLevel = config.level;
          break;
        }
      }
    }

    this.emotionalState = {
      primary,
      secondary: detectedEmotions.map((e) => e.emotion),
      intensity: maxWeight,
    };
    this.painLevel = painLevel;
    this.history.push({ text: text.slice(0, 100), emotion: primary, painLevel, timestamp: Date.now() });

    return this.getResult();
  }

  getResult() {
    return {
      emotionalState: this.emotionalState,
      painLevel: this.painLevel,
      distressDetected: this.distressDetected,
    };
  }

  getSystemPromptInsert() {
    const parts = [];
    if (this.emotionalState.primary !== "neutral") {
      parts.push(`Patient's emotional state: ${this.emotionalState.primary} (intensity: ${this.emotionalState.intensity})`);
    }
    if (this.painLevel) {
      parts.push(`Reported pain level: ${this.painLevel}`);
    }
    if (this.distressDetected) {
      parts.push("ALERT: Patient is showing signs of significant emotional distress. Respond with extra empathy and care.");
    }

    if (parts.length === 0) return "";

    return `\nEmotional Context:\n${parts.join("\n")}\n\nRespond with warmth and empathy appropriate to the patient's emotional state. If they are anxious, reassure. If they are in pain, acknowledge it. If they are distressed, be calm and supportive.\n`;
  }

  getResponseGuidance() {
    const guidance = [];

    switch (this.emotionalState.primary) {
      case "anxiety":
        guidance.push("Acknowledge their worry. Reassure calmly without dismissing their feelings.");
        break;
      case "fear":
        guidance.push("Validate their fear. Respond with gentle confidence and clear explanations.");
        break;
      case "frustration":
        guidance.push("Show understanding. Apologize for their frustration and focus on solutions.");
        break;
      case "sadness":
        guidance.push("Be warm and gentle. Show compassion. Allow space for their feelings.");
        break;
      case "anger":
        guidance.push("Stay calm. Don't match their tone. Acknowledge their anger and redirect constructively.");
        break;
      case "confusion":
        guidance.push("Be patient. Explain simply. Ask if they'd like clarification.");
        break;
      case "distress":
        guidance.push("Be calm and reassuring. Speak slowly and clearly. Prioritize their immediate safety.");
        break;
    }

    if (this.painLevel === "severe") {
      guidance.push("Acknowledge their pain is serious. Ensure they receive appropriate medical attention.");
    }

    return guidance.length > 0 ? `Communication guidance: ${guidance.join(" ")}` : "";
  }

  reset() {
    this.emotionalState = { primary: "neutral", secondary: [], intensity: 0 };
    this.painLevel = null;
    this.distressDetected = false;
    this.history = [];
  }
}

export function createEmotionAnalyzer() {
  return new EmotionAnalyzer();
}
