import { RED_FLAGS, TIERS, TIER_ACTIONS, classifyTier, getTierActions, getTierConfig, EMERGENCY_SCRIPT, CRISIS_SCRIPT } from "../config/triageDecisionTable.js";
import { SPECIALTY_TEMPLATES, getSpecialtyForKeywords } from "../config/specialtyTemplates.js";

export class TriageEngine {
  constructor(options = {}) {
    this.callbacks = {
      onTierChange: options.onTierChange || (() => {}),
      onEmergency: options.onEmergency || (() => {}),
      onAlert: options.onAlert || (() => {}),
    };
    this.currentTier = 3;
    this.highestTier = 3;
    this.redFlags = [];
    this.symptomsReported = [];
    this.escalationAction = null;
    this.crisisPathwayUsed = false;
    this.identityVerified = false;
    this.consentRecorded = false;
    this.concerningStatements = [];
    this.languageUsed = options.language || "en";
    this.specialty = null;
    this.specialtyTemplate = null;
  }

  detectSpecialty(text) {
    const matched = getSpecialtyForKeywords(text);
    if (matched && matched !== this.specialty) {
      this.specialty = matched;
      this.specialtyTemplate = SPECIALTY_TEMPLATES[matched];
      console.log(`[TriageEngine] Detected specialty: ${matched}`);
    }
    return this.specialty;
  }

  screenUtterance(text) {
    if (!text || !text.trim()) return { tier: this.currentTier, escalated: false };

    this.detectSpecialty(text);

    const lower = text.toLowerCase();

    if (this.specialtyTemplate?.highRiskSymptoms) {
      for (const symptom of this.specialtyTemplate.highRiskSymptoms) {
        if (lower.includes(symptom)) {
          this.redFlags.push({ tier: 1, keyword: `specialty: ${symptom}`, text: text.slice(0, 100), source: this.specialty });
        }
      }
    }
    const detectedTiers = new Set();
    const newRedFlags = [];
    let isCrisis = false;

    for (const keyword of RED_FLAGS.EMERGENCY.keywords) {
      if (lower.includes(keyword)) {
        detectedTiers.add(0);
        newRedFlags.push({ tier: 0, keyword, text: text.slice(0, 100) });
      }
    }

    for (const keyword of RED_FLAGS.CRISIS.keywords) {
      if (lower.includes(keyword)) {
        detectedTiers.add(0);
        detectedTiers.add("crisis");
        newRedFlags.push({ tier: 0, keyword, text: text.slice(0, 100), crisis: true });
        isCrisis = true;
      }
    }

    for (const keyword of RED_FLAGS.URGENT.keywords) {
      if (lower.includes(keyword)) {
        detectedTiers.add(1);
        newRedFlags.push({ tier: 1, keyword, text: text.slice(0, 100) });
      }
    }

    // Emotional distress detection (severe distress → Tier 1 urgent)
    const distressKeywords = ["can't breathe", "help me", "please help", "i can't handle", "overwhelmed", "desperate", "can't cope", "i'm dying", "something's wrong", "i need help", "i can't do this"];
    for (const kw of distressKeywords) {
      if (lower.includes(kw)) {
        detectedTiers.add(1);
        newRedFlags.push({ tier: 1, keyword: `distress: ${kw}`, text: text.slice(0, 100), source: "emotion" });
      }
    }

    // Severe pain detection
    const severePainPatterns = ["agonizing", "excruciating", "unbearable", "worst pain", "severe pain", "intense pain", "crippling", "debilitating", "can't move", "screaming"];
    const numericSeverePain = /\b(9|10)\s*(?:\/|\s*out\s*of\s*)?\s*10\b/i;
    for (const kw of severePainPatterns) {
      if (lower.includes(kw)) {
        detectedTiers.add(1);
        newRedFlags.push({ tier: 1, keyword: `severe pain: ${kw}`, text: text.slice(0, 100), source: "pain" });
      }
    }
    if (numericSeverePain.test(lower)) {
      detectedTiers.add(1);
      newRedFlags.push({ tier: 1, keyword: "severe pain: numeric 9-10/10", text: text.slice(0, 100), source: "pain" });
    }

    if (newRedFlags.length > 0) {
      this.redFlags.push(...newRedFlags);
      this.concerningStatements.push({ text: text.slice(0, 200), timestamp: Date.now(), flags: newRedFlags.map(f => f.keyword) });
    }

    const newTier = classifyTier([...detectedTiers]);
    const prevTier = this.currentTier;

    if (newTier < this.currentTier) {
      this.currentTier = newTier;
      if (newTier < this.highestTier) {
        this.highestTier = newTier;
      }
      this.escalationAction = {
        tier: newTier,
        config: getTierConfig(newTier),
        actions: getTierActions(newTier),
        crisisPathway: isCrisis,
      };
      this.callbacks.onTierChange({
        from: prevTier,
        to: newTier,
        isCrisis,
        redFlags: newRedFlags,
        timestamp: Date.now(),
      });
      if (isCrisis) {
        this.crisisPathwayUsed = true;
      }
      return { tier: newTier, escalated: true, isCrisis, actions: this.escalationAction };
    }

    return { tier: this.currentTier, escalated: false };
  }

  getEmergencyScript() {
    return EMERGENCY_SCRIPT;
  }

  getCrisisScript() {
    return CRISIS_SCRIPT;
  }

  getCallSummary() {
    return {
      triageTier: this.currentTier,
      highestTier: this.highestTier,
      tierLabel: getTierConfig(this.currentTier).label,
      redFlags: this.redFlags,
      concerningStatements: this.concerningStatements,
      escalationAction: this.escalationAction,
      crisisPathwayUsed: this.crisisPathwayUsed,
      identityVerified: this.identityVerified,
      consentRecorded: this.consentRecorded,
    };
  }

  getSystemPromptInsert() {
    const safetyRules = [
      "SAFETY: This is a healthcare call. You must follow these rules in order:",
      "1. If the patient says anything that sounds like an emergency (chest pain, trouble breathing, stroke signs, severe bleeding, suicidal thoughts, severe allergic reaction), STOP the current topic immediately. Tell them: 'This may be an emergency. Please hang up and call 911 right now.' Do NOT try to assess further or reassure.",
      "2. If the patient mentions self-harm or suicidal thoughts, tell them: 'If you are thinking about hurting yourself, please call or text 988 now.'",
      "3. If symptoms sound concerning but not life-threatening, tell them: 'I will make sure a nurse calls you today.'",
      "4. Never diagnose, interpret results, or give medical advice.",
      "5. When in doubt about severity, err on the side of safety and escalate.",
      "6. Never lower a concern level on your own judgment.",
      "7. If the patient asks to stop calls, say 'I understand. I will note that you do not wish to receive further calls.' and end the call.",
      "",
    ];

    if (this.identityVerified) {
      safetyRules.push("Identity verified: confirmed patient or authorized proxy.");
    }
    if (this.consentRecorded) {
      safetyRules.push("Recording consent obtained.");
    }

    return safetyRules.join("\n");
  }

  setIdentityVerified(val) {
    this.identityVerified = val;
  }

  setConsentRecorded(val) {
    this.consentRecorded = val;
  }

  reset() {
    this.currentTier = 3;
    this.highestTier = 3;
    this.redFlags = [];
    this.symptomsReported = [];
    this.escalationAction = null;
    this.crisisPathwayUsed = false;
    this.concerningStatements = [];
  }
}

export function createTriageEngine(options = {}) {
  return new TriageEngine(options);
}
