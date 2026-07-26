const CPT_MAP = {
  phone_minimal: { code: "99421", label: "Online digital E&M, established patient, 5-10 min", reimbursement: "$15-30", note: "Suggestion only — verify with provider" },
  phone_low: { code: "99422", label: "Online digital E&M, established patient, 11-20 min", reimbursement: "$30-50", note: "Suggestion only — verify with provider" },
  phone_moderate: { code: "99423", label: "Online digital E&M, established patient, 21+ min", reimbursement: "$50-75", note: "Suggestion only — verify with provider" },
  audio_only_minimal: { code: "98966", label: "Audio-only E&M, established patient, 5-10 min", reimbursement: "$15-25", note: "Suggestion only — verify with provider" },
  audio_only_low: { code: "98967", label: "Audio-only E&M, established patient, 11-20 min", reimbursement: "$25-40", note: "Suggestion only — verify with provider" },
  audio_only_moderate: { code: "98968", label: "Audio-only E&M, established patient, 21+ min", reimbursement: "$40-60", note: "Suggestion only — verify with provider" },
  followup: { code: "99212", label: "Established patient follow-up, straightforward", reimbursement: "$30-75", note: "Suggestion only — verify with provider" },
  triage: { code: "99202", label: "New/established triage assessment", reimbursement: "$40-100", note: "Suggestion only — verify with provider" },
};

export function suggestCptCode(triageLevel, durationSeconds, callType = "phone") {
  const durationMin = durationSeconds ? Math.floor(durationSeconds / 60) : 0;

  if (callType === "phone") {
    if (durationMin > 20) return CPT_MAP.phone_moderate;
    if (durationMin > 10) return CPT_MAP.phone_low;
    return CPT_MAP.phone_minimal;
  }

  if (callType === "audio-only") {
    if (durationMin > 20) return CPT_MAP.audio_only_moderate;
    if (durationMin > 10) return CPT_MAP.audio_only_low;
    return CPT_MAP.audio_only_minimal;
  }

  if (triageLevel <= 1) return CPT_MAP.triage;
  return CPT_MAP.followup;
}

export function getCptCodeInfo(code) {
  for (const [, info] of Object.entries(CPT_MAP)) {
    if (info.code === code) return info;
  }
  return null;
}
