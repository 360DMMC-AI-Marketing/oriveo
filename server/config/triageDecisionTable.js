export const TIERS = {
  EMERGENCY: {
    level: 0,
    label: "Emergency",
    color: "red",
    sla: "Immediate",
  },
  URGENT: {
    level: 1,
    label: "Urgent",
    color: "amber",
    sla: "Same day",
  },
  ROUTINE: {
    level: 2,
    label: "Routine",
    color: "blue",
    sla: "Next business day",
  },
  STABLE: {
    level: 3,
    label: "Stable",
    color: "green",
    sla: "Chart note only",
  },
};

export const EMERGENCY_SCRIPT =
  "This may be an emergency. Please hang up and call 911 right now. I will notify your care team immediately.";

export const CRISIS_SCRIPT =
  "If you are thinking about hurting yourself, please call or text 988 now. The Suicide and Crisis Lifeline has trained counselors available 24/7. Would you like me to stay on the line with you while you call?";

export const RED_FLAGS = {
  EMERGENCY: {
    keywords: [
      "chest pain", "chest pressure", "tightness in chest",
      "trouble breathing", "can't breathe", "shortness of breath", "difficulty breathing",
      "face droop", "face drooping", "arm weakness", "slurred speech",
      "sudden severe headache", "worst headache of my life",
      "uncontrolled bleeding", "bleeding won't stop",
      "fainted", "passed out", "unconscious", "can't wake up",
      "fell and can't get up", "fall with injury",
      "severe confusion", "don't know where I am",
      "severe allergic reaction", "can't swallow", "throat swelling",
      "want to hurt myself", "want to die", "suicide", "kill myself",
      "overdose", "took too much",
    ],
    triageKeywords: [
      "911", "emergency", "ambulance", "call 911",
    ],
  },
  URGENT: {
    keywords: [
      "high fever", "fever of", "temperature of",
      "severe pain", "excruciating pain", "pain is bad",
      "vomiting blood", "coughing up blood", "blood in stool",
      "burning when urinate", "can't urinate",
      "new confusion", "more confused than usual",
      "fall", "fell down",
      "worsening symptoms", "getting worse",
      "medication reaction", "side effect",
      "infected", "infection", "redness spreading",
    ],
  },
  CRISIS: {
    keywords: [
      "want to die", "kill myself", "suicide", "end my life",
      "don't want to be here", "better off dead",
      "hurt myself", "self harm", "cutting",
      "988", "crisis",
    ],
  },
};

export const TIER_ACTIONS = {
  0: {
    stopNormalFlow: true,
    playScript: EMERGENCY_SCRIPT,
    alwaysAlert: true,
    alertMethod: "immediate_page",
    chartFlag: true,
    humanAction: "Immediate page/secure alert to on-call clinician + ops. Document.",
    notes: "Fixed emergency script — verbatim, not LLM-generated. Agent never reassures or downgrades.",
  },
  1: {
    stopNormalFlow: true,
    playScript: "I understand this concerns you. I'm going to make sure a nurse calls you today to follow up.",
    alwaysAlert: true,
    alertMethod: "urgent_task",
    chartFlag: true,
    humanAction: "Triage RN contacts patient same day (define exact window). Warm transfer if staffed.",
    notes: "Agent reassures procedurally only. Never says 'you'll be fine' or minimizes.",
  },
  2: {
    stopNormalFlow: false,
    playScript: null,
    alwaysAlert: false,
    alertMethod: "queue_task",
    chartFlag: true,
    humanAction: "Appropriate team follows up next business day (scheduling / refill / records queue).",
    notes: "Non-urgent questions, refill needs, minor issues, scheduling needs.",
  },
  3: {
    stopNormalFlow: false,
    playScript: null,
    alwaysAlert: false,
    alertMethod: "none",
    chartFlag: true,
    humanAction: "Chart note only; no task.",
    notes: "No concerns reported. Reinforce next steps and next appointment.",
  },
};

export function classifyTier(detectedTiers) {
  if (detectedTiers.includes(0)) return 0;
  if (detectedTiers.includes("crisis")) return 0;
  if (detectedTiers.includes(1)) return 1;
  if (detectedTiers.includes(2)) return 2;
  return 3;
}

export function getTierActions(tier) {
  return TIER_ACTIONS[tier] || TIER_ACTIONS[3];
}

export function getTierConfig(tier) {
  const map = { 0: TIERS.EMERGENCY, 1: TIERS.URGENT, 2: TIERS.ROUTINE, 3: TIERS.STABLE };
  return map[tier] || map[3];
}
