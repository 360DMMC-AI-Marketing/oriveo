export const BILLING_CODE_SETS = {
  "cpt": {
    label: "CPT (Current Procedural Terminology)",
    description: "Standard medical billing codes for physician services",
    noteLabel: "CPT Code",
    unitType: "per-visit",
    codePattern: /^\d{5}$/,
    examples: ["99213", "99214", "99215", "93000", "93306"],
  },
  "cdt": {
    label: "CDT (Current Dental Terminology)",
    description: "Standard dental billing codes (D-codes)",
    noteLabel: "CDT Code",
    unitType: "per-tooth",
    codePattern: /^D\d{4}$/,
    examples: ["D0120", "D2740", "D3310", "D8080", "D5110"],
  },
  "timed-units": {
    label: "Timed Units (8-Minute Rule)",
    description: "Therapy billing based on timed treatment minutes",
    noteLabel: "CPT Code + Units",
    unitType: "per-15min",
    codePattern: /^\d{5}$/,
    examples: ["97110", "97112", "97116", "97530", "97750"],
    rules: {
      unitMinutes: 15,
      minPerUnit: 8,
      description: "1 unit = 8-22 min, 2 units = 23-37 min, 3 units = 38-52 min, 4 units = 53-67 min",
    },
  },
  "mixed": {
    label: "Mixed (Medical + Veterinary Codes)",
    description: "Supports both CPT codes and veterinary-specific billing",
    noteLabel: "Service Code",
    unitType: "per-service",
    codePattern: /^[\w\d]+$/,
    examples: ["99213", "87804", "90414", "Surgical - Level 2"],
  },
};

export function getBillingCodeSet(codeSetId) {
  return BILLING_CODE_SETS[codeSetId] || BILLING_CODE_SETS.cpt;
}
