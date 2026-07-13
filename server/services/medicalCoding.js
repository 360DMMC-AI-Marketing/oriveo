const CPT_MAP = {
  minimal: { code: "99281", label: "Emergency visit - minimal severity", reimbursement: "$25-50" },
  low: { code: "99282", label: "Emergency visit - low severity", reimbursement: "$50-100" },
  moderate: { code: "99283", label: "Emergency visit - moderate severity", reimbursement: "$75-150" },
  high: { code: "99284", label: "Emergency visit - high severity", reimbursement: "$150-300" },
  critical: { code: "99285", label: "Emergency visit - critical severity", reimbursement: "$200-500" },
  phone_minimal: { code: "99441", label: "Phone call - 5-10 min", reimbursement: "$15-30" },
  phone_low: { code: "99442", label: "Phone call - 11-20 min", reimbursement: "$30-50" },
  phone_moderate: { code: "99443", label: "Phone call - 21-30 min", reimbursement: "$50-75" },
  followup: { code: "99212", label: "Established patient follow-up", reimbursement: "$30-75" },
  triage: { code: "99202", label: "New/established triage assessment", reimbursement: "$40-100" },
};

export function suggestCptCode(triageLevel, durationSeconds, callType = "phone") {
  const durationMin = durationSeconds ? Math.floor(durationSeconds / 60) : 0;

  if (callType === "phone") {
    if (triageLevel <= 0) return CPT_MAP.critical;
    if (triageLevel <= 1) return durationMin > 20 ? CPT_MAP.phone_moderate : CPT_MAP.phone_low;
    if (triageLevel <= 2) return durationMin > 10 ? CPT_MAP.phone_low : CPT_MAP.phone_minimal;
    return CPT_MAP.phone_minimal;
  }

  if (triageLevel <= 0) return CPT_MAP.critical;
  if (triageLevel <= 1) return CPT_MAP.high;
  if (triageLevel <= 2) return CPT_MAP.moderate;
  if (triageLevel <= 3) return CPT_MAP.low;
  return CPT_MAP.minimal;
}

export function getCptCodeInfo(code) {
  for (const [, info] of Object.entries(CPT_MAP)) {
    if (info.code === code) return info;
  }
  return null;
}
