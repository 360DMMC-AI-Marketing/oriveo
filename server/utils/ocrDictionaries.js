const dictionaries = [
  { keywords: ["cbc", "complete blood count", "hba1c", "lipid", "glucose", "creatinine", "bun", "alt", "ast", "wbc", "rbc", "hemoglobin", "platelet"], type: "Lab Result", tags: ["general", "blood"] },
  { keywords: ["panoramic", "panorex", "bitewing", "periapical", "ceph", "cephalometric"], type: "X-ray", tags: ["dental"] },
  { keywords: ["extraction", "root canal", "endodontic", "crown", "bridge", "implant", "prosthesis"], type: "Treatment Plan", tags: ["dental"] },
  { keywords: ["periodontal", "scaling", "root planing", "pocket", "gum"], type: "Periodontal Chart", tags: ["dental"] },
  { keywords: ["fecal", "heartworm", "fiv", "felv", "distemper", "parvovirus", "rabies titer"], type: "Lab Result", tags: ["veterinary"] },
  { keywords: ["vaccine", "vaccination", "dhpp", "fvrcp", "bordetella", "leptospirosis"], type: "Vaccination Record", tags: ["veterinary"] },
  { keywords: ["echocardiogram", "echo", "doppler", "ejection fraction"], type: "Imaging", tags: ["cardiology"] },
  { keywords: ["ecg", "ekg", "electrocardiogram", "holter", "stress test", "treadmill"], type: "ECG Report", tags: ["cardiology"] },
  { keywords: ["mri", "magnetic resonance", "ct scan", "cat scan", "ultrasound", "x-ray", "radiograph"], type: "Imaging", tags: ["radiology"] },
  { keywords: ["biopsy", "pathology", "histopathology", "cytology"], type: "Pathology Report", tags: ["general"] },
  { keywords: ["prescription", "rx", "take", "tablet", "capsule", "mg", "ml", "dispense"], type: "Prescription", tags: ["general"] },
  { keywords: ["referral", "referred", "consultation request"], type: "Referral Letter", tags: ["general"] },
  { keywords: ["consent", "informed consent", "authorization", "waiver"], type: "Consent Form", tags: ["general"] },
  { keywords: ["discharge", "discharge summary", "hospital course"], type: "Discharge Summary", tags: ["general"] },
  { keywords: ["orthopedic", "fracture", "dislocation", "sprain", "arthritis"], type: "Orthopedic Report", tags: ["orthopedics"] },
  { keywords: ["dermatology", "rash", "lesion", "biopsy", "patch test"], type: "Dermatology Report", tags: ["dermatology"] },
  { keywords: ["microchip", "identification", "id tag"], type: "Identification", tags: ["veterinary"] },
  { keywords: ["spay", "neuter", "ovariohysterectomy", "castration"], type: "Surgery Record", tags: ["veterinary"] },
];

export function autoTagDocument(ocrText) {
  const lower = ocrText.toLowerCase();
  const matched = { type: "other", tags: [] };
  let bestScore = 0;
  for (const entry of dictionaries) {
    let score = entry.keywords.filter(kw => lower.includes(kw)).length;
    if (score > bestScore) {
      bestScore = score;
      matched.type = entry.type;
      matched.tags = [...entry.tags];
    }
  }
  if (bestScore === 0) {
    if (lower.includes("lab") || lower.includes("test") || lower.includes("result") || lower.includes("panel")) {
      matched.type = "Lab Result";
    } else if (lower.includes("letter") || lower.includes("dear")) {
      matched.type = "Referral Letter";
    }
  }
  return matched;
}
