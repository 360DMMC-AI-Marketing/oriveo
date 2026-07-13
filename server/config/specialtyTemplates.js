export const SPECIALTY_TEMPLATES = {
  general: {
    label: "General Practice",
    keywords: [],
    triagePrompt: "Standard triage assessment for general medical concerns.",
  },
  pediatrics: {
    label: "Pediatrics",
    keywords: ["child", "baby", "infant", "toddler", "newborn", "fever in child", "my kid", "my son", "my daughter"],
    triagePrompt: "This is a pediatric case. Children can deteriorate faster than adults. Pay special attention to fever, dehydration, breathing difficulty, and rash with fever. Weight-based medication dosing may be needed. Always consider Kawasaki disease, meningitis, and respiratory syncytial virus in young children.",
    highRiskSymptoms: ["high fever in infant", "difficulty breathing", "lethargy", "not drinking", "purple rash", "seizure", "dehydration"],
  },
  cardiology: {
    label: "Cardiology",
    keywords: ["chest pain", "heart", "palpitations", "shortness of breath", "cardiac", "blood pressure", "hypertension", "heart attack", "chest tightness"],
    triagePrompt: "This is a potential cardiac case. Chest pain requires immediate attention to rule out myocardial infarction. Ask about radiation to arm/jaw, shortness of breath, diaphoresis, nausea. Consider angina vs MI. Check cardiac history and risk factors.",
    highRiskSymptoms: ["chest pain with radiation", "shortness of breath at rest", "syncope", "palpitations with dizziness", "severe hypertension"],
  },
  neurology: {
    label: "Neurology",
    keywords: ["headache", "migraine", "dizziness", "vertigo", "numbness", "tingling", "seizure", "stroke", "facial droop", "slurred speech", "confusion", "head injury"],
    triagePrompt: "This is a potential neurological case. Assess for stroke symptoms using FAST: Facial drooping, Arm weakness, Speech difficulty, Time to call emergency. Headache with neurological signs requires urgent imaging. Differentiate migraine from subarachnoid hemorrhage.",
    highRiskSymptoms: ["sudden severe headache", "facial droop", "arm weakness", "slurred speech", "seizure", "loss of consciousness", "head injury with confusion"],
  },
  respiratory: {
    label: "Respiratory",
    keywords: ["cough", "wheezing", "asthma", "difficulty breathing", "short of breath", "pneumonia", "bronchitis", "covid", "breathless", "oxygen"],
    triagePrompt: "This is a potential respiratory case. Assess breathing rate, oxygen saturation, ability to speak in full sentences, use of accessory muscles. Differentiate upper vs lower respiratory tract infection. Consider asthma exacerbation, COPD, pneumonia, pulmonary embolism.",
    highRiskSymptoms: ["cannot speak full sentences", "blue lips", "chest retractions", "stridor", "hemoptysis", "respiratory rate over 30"],
  },
  gastroenterology: {
    label: "Gastroenterology",
    keywords: ["stomach pain", "abdominal pain", "nausea", "vomiting", "diarrhea", "constipation", "blood in stool", "heartburn", "indigestion", "appendicitis"],
    triagePrompt: "This is a potential gastrointestinal case. Assess for signs of peritonitis, appendicitis, pancreatitis, cholecystitis, gastroenteritis, or GI bleeding. Ask about location and nature of pain, associated symptoms, and risk factors.",
    highRiskSymptoms: ["blood in vomit", "blood in stool", "severe abdominal pain with rigidity", "bilious vomiting", "inability to pass gas"],
  },
  mental_health: {
    label: "Mental Health",
    keywords: ["anxiety", "depression", "suicidal", "panic attack", "mental health", "crisis", "self-harm", "psychiatric", "bipolar", "schizophrenia", "hallucination"],
    triagePrompt: "This is a mental health case. Assess for immediate danger to self or others. Ask about suicidal ideation, plan, intent, means. Use a calm and non-judgmental approach. Have crisis resources ready. Differentiate panic attack from cardiac emergency.",
    highRiskSymptoms: ["suicidal ideation with plan", "active self-harm", "hearing voices commanding harm", "aggressive behavior", "acute psychosis"],
    crisisResources: {
      national: "988 Suicide & Crisis Lifeline",
      emergency: "Call 911 or go to nearest ER",
    },
  },
  orthopedics: {
    label: "Orthopedics / Musculoskeletal",
    keywords: ["fracture", "broken bone", "sprain", "strain", "back pain", "neck pain", "joint pain", "swelling", "injury", "fall", "sports injury"],
    triagePrompt: "This is a potential orthopedic case. Assess for fracture, dislocation, sprain, or strain. Check for deformity, swelling, ability to bear weight, range of motion, neurovascular status distal to injury. Consider X-ray needs.",
    highRiskSymptoms: ["open fracture", "deformity", "no pulse distal", "numbness distal", "cannot bear weight", "high-energy mechanism"],
  },
  obstetrics: {
    label: "Obstetrics / Gynecology",
    keywords: ["pregnant", "pregnancy", "contractions", "vaginal bleeding", "labor", "miscarriage", "prenatal", "gynecology", "menstrual", "pelvic pain"],
    triagePrompt: "This is a potential obstetric/gynecological case. Third trimester bleeding is an emergency until proven otherwise. Assess gestational age, bleeding amount, pain, contractions. Differentiate labor from Braxton Hicks. Ectopic pregnancy must be ruled out in first trimester bleeding with pain.",
    highRiskSymptoms: ["third trimester bleeding", "severe abdominal pain in pregnancy", "ruptured membranes", "decreased fetal movement", "preeclampsia symptoms"],
  },
};

export function getSpecialtyForKeywords(text) {
  if (!text) return null;
  const lower = text.toLowerCase();
  let bestMatch = null;
  let maxScore = 0;

  for (const [key, template] of Object.entries(SPECIALTY_TEMPLATES)) {
    if (key === "general") continue;
    let score = 0;
    for (const kw of template.keywords) {
      if (lower.includes(kw)) score += kw.length;
    }
    if (score > maxScore) {
      maxScore = score;
      bestMatch = key;
    }
  }
  return bestMatch;
}
