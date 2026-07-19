import { REPORT_TEMPLATES } from "./reportTemplates.js";

export const SPECIALTY_TEMPLATES = {
  "general-practice": {
    label: "General Practice / Family Medicine",
    keywords: ["fever", "cough", "cold", "flu", "sore throat", "rash", "checkup", "physical", "infection", "sick", "general", "family medicine"],
    triagePrompt: "Standard triage assessment for general medical concerns. Assess vital signs, chief complaint, and risk factors. Consider common conditions: URI, UTI, gastroenteritis, skin infections, hypertension, diabetes management.",
    highRiskSymptoms: ["chest pain", "difficulty breathing", "severe bleeding", "loss of consciousness", "severe allergic reaction", "high fever with stiff neck"],
    reportTemplate: REPORT_TEMPLATES["general-practice"],
  },
  "cardiology": {
    label: "Cardiology",
    keywords: ["chest pain", "heart", "palpitations", "shortness of breath", "cardiac", "blood pressure", "hypertension", "heart attack", "chest tightness", "swelling ankles", "heart failure"],
    triagePrompt: "This is a potential cardiac case. Chest pain requires immediate attention to rule out myocardial infarction. Ask about radiation to arm/jaw, shortness of breath, diaphoresis, nausea. Consider angina vs MI. Check cardiac history and risk factors. Assess for heart failure symptoms: orthopnea, PND, edema.",
    highRiskSymptoms: ["chest pain with radiation", "shortness of breath at rest", "syncope", "palpitations with dizziness", "severe hypertension >180/120", "crushing chest pressure"],
    reportTemplate: REPORT_TEMPLATES["cardiology"],
  },
  "pediatrics": {
    label: "Pediatrics",
    keywords: ["child", "baby", "infant", "toddler", "newborn", "fever in child", "my kid", "my son", "my daughter", "teething", "ear infection"],
    triagePrompt: "This is a pediatric case. Children can deteriorate faster than adults. Pay special attention to fever, dehydration, breathing difficulty, and rash with fever. Weight-based medication dosing is critical. Always consider Kawasaki disease, meningitis, and RSV in young children. Assess feeding, urine output, activity level.",
    highRiskSymptoms: ["high fever in infant under 3 months", "difficulty breathing", "lethargy", "not drinking", "purple rash", "seizure", "dehydration", "grunting respirations"],
    reportTemplate: REPORT_TEMPLATES["pediatrics"],
  },
  "neurology": {
    label: "Neurology",
    keywords: ["headache", "migraine", "dizziness", "vertigo", "numbness", "tingling", "seizure", "stroke", "facial droop", "slurred speech", "confusion", "head injury", "memory loss"],
    triagePrompt: "This is a potential neurological case. Assess for stroke symptoms using FAST: Facial drooping, Arm weakness, Speech difficulty, Time to call emergency. Headache with neurological signs requires urgent imaging. Differentiate migraine from subarachnoid hemorrhage. Seizure assessment: first-time vs known epilepsy, duration, post-ictal state.",
    highRiskSymptoms: ["sudden severe headache", "facial droop", "arm weakness", "slurred speech", "seizure >5 minutes", "loss of consciousness", "head injury with confusion", "sudden vision loss"],
    reportTemplate: REPORT_TEMPLATES["neurology"],
  },
  "psychiatry": {
    label: "Psychiatry / Behavioral Health",
    keywords: ["anxiety", "depression", "suicidal", "panic attack", "mental health", "crisis", "self-harm", "psychiatric", "bipolar", "schizophrenia", "hallucination", "mood", "therapy"],
    triagePrompt: "This is a mental health case. Assess for immediate danger to self or others. Ask about suicidal ideation, plan, intent, means, and protective factors. Use a calm, non-judgmental approach. Have crisis resources ready: 988 Suicide & Crisis Lifeline. Differentiate panic attack from cardiac emergency. Screen for substance use.",
    highRiskSymptoms: ["suicidal ideation with plan", "active self-harm", "hearing voices commanding harm", "aggressive behavior", "acute psychosis", "mania with poor judgment"],
    crisisResources: { national: "988 Suicide & Crisis Lifeline", emergency: "Call 911 or go to nearest ER" },
    reportTemplate: REPORT_TEMPLATES["psychiatry"],
  },
  "dermatology": {
    label: "Dermatology",
    keywords: ["rash", "skin", "mole", "lesion", "itching", "eczema", "psoriasis", "acne", "skin cancer", "biopsy", "derm", "sun damage", "wart", "fungal"],
    triagePrompt: "This is a dermatological case. Assess rash: onset, duration, distribution, morphology (macules, papules, vesicles, pustules), pruritus, pain. Use ABCDE for pigmented lesions: Asymmetry, Border irregularity, Color variation, Diameter >6mm, Evolution. Consider cellulitis vs contact dermatitis vs shingles.",
    highRiskSymptoms: ["rash with fever", "rapidly spreading redness", "blistering over large area", "skin necrosis", "lesion changing rapidly"],
    reportTemplate: REPORT_TEMPLATES["dermatology"],
  },
  "therapy": {
    label: "Physical / Occupational / Speech Therapy",
    keywords: ["physical therapy", "occupational therapy", "speech therapy", "rehab", "rehabilitation", "exercise", "mobility", "range of motion", "muscle weakness", "gait", "swallowing", "speech"],
    triagePrompt: "This is a therapy/rehabilitation case. Assess functional limitations: mobility, ADLs, communication, swallowing. Document objective measures: ROM, MMT, Berg balance, gait analysis, pain scale. Track progress toward functional goals. Apply 8-minute billing rule for timed units.",
    highRiskSymptoms: ["sudden loss of function", "acute fall with injury", "new difficulty swallowing", "sudden speech loss", "severe pain limiting movement"],
    reportTemplate: REPORT_TEMPLATES["therapy"],
  },
  "gastroenterology": {
    label: "Gastroenterology",
    keywords: ["stomach pain", "abdominal pain", "nausea", "vomiting", "diarrhea", "constipation", "blood in stool", "heartburn", "indigestion", "colonoscopy", "IBD", "Crohn's", "ulcerative colitis"],
    triagePrompt: "This is a potential gastrointestinal case. Assess for peritonitis, appendicitis, pancreatitis, cholecystitis, gastroenteritis, or GI bleeding. Evaluate location, nature, and radiation of pain, associated symptoms, and risk factors. Use Rome IV criteria for functional disorders.",
    highRiskSymptoms: ["blood in vomit", "blood in stool (melena/hematochezia)", "severe abdominal pain with rigidity", "bilious vomiting", "inability to pass gas/stool", "peritoneal signs"],
    reportTemplate: REPORT_TEMPLATES["gastroenterology"],
  },
  "endocrinology": {
    label: "Endocrinology",
    keywords: ["diabetes", "thyroid", "hormone", "insulin", "blood sugar", "glucose", "HbA1c", "osteoporosis", "calcium", "adrenal", "pituitary", "testosterone", "estrogen"],
    triagePrompt: "This is an endocrine case. Assess glycemic control: HbA1c, hypoglycemic episodes, DKA risk. For thyroid: hyperthyroid vs hypothyroid symptoms. For bone health: fracture risk, falls. Check medication adherence and monitoring frequency.",
    highRiskSymptoms: ["hypoglycemia with altered mental status", "DKA symptoms", "thyroid storm symptoms", "adrenal crisis symptoms", "severe hypercalcemia"],
    reportTemplate: REPORT_TEMPLATES["endocrinology"],
  },
  "oncology": {
    label: "Oncology",
    keywords: ["cancer", "tumor", "chemotherapy", "radiation", "oncology", "malignancy", "biopsy", "metastasis", "immunotherapy", "palliative", "hospice"],
    triagePrompt: "This is an oncology case. Assess treatment tolerance, side effects, and disease status. Check for neutropenic fever (oncologic emergency), treatment toxicity per CTCAE v5, and performance status (ECOG). Review current regimen and cycle. Evaluate pain management needs.",
    highRiskSymptoms: ["neutropenic fever", "severe treatment side effects", "new neurological symptoms", "sepsis symptoms", "uncontrolled pain", "suicidal ideation"],
    reportTemplate: REPORT_TEMPLATES["oncology"],
  },
  "rheumatology": {
    label: "Rheumatology",
    keywords: ["joint pain", "arthritis", "rheumatoid", "lupus", "gout", "autoimmune", "inflammation", "DMARD", "biologic", "vasculitis", "scleroderma"],
    triagePrompt: "This is a rheumatology case. Assess joint distribution (symmetrical/asymmetrical, small/large), duration of morning stiffness, inflammatory vs mechanical pain. Calculate DAS28. Check for extra-articular manifestations. Review DMARD/biologic therapy and monitoring labs.",
    highRiskSymptoms: ["severe joint pain with swelling", "new organ involvement symptoms", "vasculitic rash", "monocular vision loss", "acute monoarticular arthritis with fever"],
    reportTemplate: REPORT_TEMPLATES["rheumatology"],
  },
  "nephrology": {
    label: "Nephrology",
    keywords: ["kidney", "dialysis", "creatinine", "GFR", "renal", "CKD", "nephrology", "electrolyte", "hemodialysis", "peritoneal dialysis", "transplant"],
    triagePrompt: "This is a nephrology case. Assess volume status, electrolyte balance, and dialysis adequacy. For CKD: stage, etiology, progression. For dialysis: access type, Kt/V, UF goals. For transplant: immunosuppression, rejection signs, graft function.",
    highRiskSymptoms: ["hyperkalemia with ECG changes", "severe volume overload", "uremic symptoms", "dialysis access complications", "transplant rejection signs"],
    reportTemplate: REPORT_TEMPLATES["nephrology"],
  },
  "pulmonology": {
    label: "Pulmonology",
    keywords: ["asthma", "COPD", "cough", "wheezing", "shortness of breath", "pulmonary", "lung", "spirometry", "pneumonia", "sleep apnea", "oxygen"],
    triagePrompt: "This is a respiratory case. Assess breathing rate, O2 saturation, ability to speak in full sentences, use of accessory muscles. Differentiate upper vs lower respiratory tract infection. Consider asthma exacerbation, COPD exacerbation, pneumonia, PE. Use mMRC dyspnea scale. Check smoking history.",
    highRiskSymptoms: ["cannot speak full sentences", "blue lips/cyanosis", "chest retractions", "stridor", "hemoptysis", "respiratory rate >30", "O2 sat <90%"],
    reportTemplate: REPORT_TEMPLATES["pulmonology"],
  },
  "ophthalmology": {
    label: "Ophthalmology",
    keywords: ["eye", "vision", "blurry", "vision loss", "red eye", "eye pain", "floater", "glaucoma", "cataract", "retina", "dry eye", "conjunctivitis"],
    triagePrompt: "This is an ophthalmic case. Assess visual acuity, pain, redness, discharge, photophobia, flashing lights/floaters. Check for red flags: sudden vision loss, eye pain with nausea/vomiting (possible acute angle closure glaucoma), chemical exposure, foreign body. Measure IOP if indicated.",
    highRiskSymptoms: ["sudden vision loss", "eye pain with nausea/vomiting", "chemical eye exposure", "penetrating eye injury", "new onset floaters with flashes"],
    reportTemplate: REPORT_TEMPLATES["ophthalmology"],
  },
  "ent": {
    label: "ENT / Otolaryngology",
    keywords: ["ear", "hearing", "tinnitus", "vertigo", "sinus", "sore throat", "hoarseness", "tonsil", "thyroid", "neck mass", "allergy", "nasal"],
    triagePrompt: "This is an ENT case. Assess ear pain, hearing loss, vertigo, nasal obstruction/sinus pain, sore throat, hoarseness, neck mass. For sore throat: Centor criteria for strep. For vertigo: positional vs continuous, nystagmus, Dix-Hallpike. For hearing: audiometry, tuning fork tests.",
    highRiskSymptoms: ["airway compromise", "stridor", "severe sore throat with muffled voice/drooling", "facial nerve paralysis", "sudden hearing loss", "neck mass with rapid growth"],
    reportTemplate: REPORT_TEMPLATES["ent"],
  },
  "general-dentistry": {
    label: "General Dentistry",
    keywords: ["tooth", "teeth", "dental", "cavity", "filling", "crown", "cleaning", "gum", "mouth", "oral", "dentist"],
    triagePrompt: "This is a dental case. Assess tooth pain: onset, triggers (hot/cold/sweet/biting), spontaneous pain, swelling. Review dental history, prior restorations, oral hygiene. Perform intraoral exam, periodontal charting, and radiographic assessment. Use ADA tooth numbering. Apply caries risk assessment and periodontal staging.",
    highRiskSymptoms: ["facial swelling compromising airway", "severe dental infection spreading", "trauma with avulsed tooth", "bleeding disorder with dental emergency", "osteonecrosis risk"],
    reportTemplate: REPORT_TEMPLATES["general-dentistry"],
  },
  "orthodontics": {
    label: "Orthodontics",
    keywords: ["braces", "orthodontic", "retainer", "aligner", "malocclusion", "bite", "crowding", "overbite", "overjet", "Invisalign", "headgear"],
    triagePrompt: "This is an orthodontic case. Assess malocclusion: Angle classification, overjet, overbite, crossbite, crowding. Review treatment stage, appliance condition (wire size, bracket integrity, elastics compliance). Cephalometric analysis for skeletal assessment. Monitor PAR score progress.",
    highRiskSymptoms: ["severe pain from archwire", "bracket/band causing oral ulceration", "swelling from infection", "trauma to orthodontic appliance", "temporomandibular joint symptoms"],
    reportTemplate: REPORT_TEMPLATES["orthodontics"],
  },
  "endodontics": {
    label: "Endodontics",
    keywords: ["root canal", "tooth pain", "endodontic", "pulp", "abscess tooth", "nerve tooth", "apicoectomy"],
    triagePrompt: "This is an endodontic case. Assess tooth-specific pain: spontaneous, nocturnal, thermal sensitivity, percussion sensitivity. Perform diagnostic testing: cold/heat, EPT, percussion, palpation. Review radiographs: caries depth, pulp morphology, periapical pathology, root anatomy. Classify pulpal and periapical diagnosis per AAE standards.",
    highRiskSymptoms: ["facial swelling with systemic symptoms", "spreading infection", "severe uncontrolled pain", "trauma with tooth displacement"],
    reportTemplate: REPORT_TEMPLATES["endodontics"],
  },
  "periodontics": {
    label: "Periodontics",
    keywords: ["gum", "periodontal", "gum disease", "recession", "bleeding gums", "deep cleaning", "SRP", "perio", "flap surgery"],
    triagePrompt: "This is a periodontal case. Assess full-mouth 6-point probing depths, BOP, recession, CAL, furcation, mobility, mucogingival status. Evaluate risk factors: smoking, diabetes, genetics, medications. Classify per AAP 2018: staging (I-IV) and grading (A-C). Review radiographic bone levels.",
    highRiskSymptoms: ["acute periodontal abscess", "rapid bone loss", "tooth mobility worsening", "severe gingival bleeding with systemic symptoms"],
    reportTemplate: REPORT_TEMPLATES["periodontics"],
  },
  "oral-surgery": {
    label: "Oral Surgery",
    keywords: ["extraction", "wisdom tooth", "oral surgery", "impacted", "biopsy oral", "jaw surgery", "implant", "dental implant"],
    triagePrompt: "This is an oral surgery case. Assess surgical need: impacted teeth, pathology, implant site, orthognathic indication. Review medical history: ASA classification, anticoagulants, bisphosphonates, anesthesia risk. Evaluate imaging: panoramic, CBCT. Document surgical plan and post-operative instructions.",
    highRiskSymptoms: ["severe post-operative bleeding", "surgical site infection with swelling", "difficulty breathing after surgery", "nerve paresthesia", "osteonecrosis"],
    reportTemplate: REPORT_TEMPLATES["oral-surgery"],
  },
  "prosthodontics": {
    label: "Prosthodontics",
    keywords: ["denture", "partial", "bridge", "crown", "implant crown", "prosthetic", "prosthodontic", "false teeth", "restoration"],
    triagePrompt: "This is a prosthodontic case. Assess edentulous ridge, residual ridge classification, undercuts, occlusion, interarch space. Evaluate abutments: crown-to-root ratio, periodontal health, implant stability. Select restorative materials. Kennedy classification for RPD design.",
    highRiskSymptoms: ["ill-fitting denture causing trauma", "broken prosthesis with sharp edges", "implant mobility", "severe sore spots"],
    reportTemplate: REPORT_TEMPLATES["prosthodontics"],
  },
  "pediatric-dentistry": {
    label: "Pediatric Dentistry",
    keywords: ["child tooth", "kid tooth", "baby tooth", "pediatric dental", "children's dentist", "sealant", "fluoride child"],
    triagePrompt: "This is a pediatric dental case. Assess dental development (primary/mixed/permanent), eruption status, caries risk per AAPD C.R.A.T. Behavioral assessment (Frankl scale). Age-appropriate preventive care: fluoride varnish, sealants. Consider need for sedation/GA for treatment. Dietary and habit counseling.",
    highRiskSymptoms: ["dental trauma with avulsed/permanent tooth", "swelling from dental infection", "pain unresponsive to medication", "early childhood caries with pain"],
    reportTemplate: REPORT_TEMPLATES["pediatric-dentistry"],
  },
  "small-animal": {
    label: "Small Animal (Dogs & Cats)",
    keywords: ["dog", "cat", "puppy", "kitten", "veterinary", "vet", "rabies", "heartworm", "flea", "tick", "pet", "animal"],
    triagePrompt: "This is a small animal veterinary case. Assess signalment: species, breed, age, sex, weight, BCS. Perform TPR and full physical exam by systems. Review vaccination status, parasite prevention, diet. Consider species-specific conditions: heartworm in dogs, FIV/FeLV in cats, urinary obstruction in male cats.",
    highRiskSymptoms: ["gastric dilation-volvulus (bloat)", "urinary obstruction", "seizure", "trauma with open fracture", "toxin ingestion", "heat stroke", "dystocia"],
    reportTemplate: REPORT_TEMPLATES["small-animal"],
  },
  "equine": {
    label: "Equine (Horses)",
    keywords: ["horse", "equine", "foal", "mare", "stallion", "colic", "lameness horse", "farrier", "coggins", "equestrian"],
    triagePrompt: "This is an equine case. Assess signalment: breed, age, use (pleasure/race/show/breeding), vaccination/deworming/Coggins status. Perform TPR: normal ranges differ from small animal. Lameness exam per AAEP scale 0-5. Evaluate colic: pain level, gut sounds, manure, heart rate, respiratory rate, CRT. Dental float assessment.",
    highRiskSymptoms: ["severe colic with elevated HR >60", "laminitis/founder", "severe laceration with joint involvement", "sepsis in foal", "eye injury/corneal ulcer"],
    reportTemplate: REPORT_TEMPLATES["equine"],
  },
  "exotic-pets": {
    label: "Exotic Pets (Avian, Reptile, Small Mammal)",
    keywords: ["bird", "reptile", "snake", "lizard", "turtle", "rabbit", "guinea pig", "hamster", "ferret", "chinchilla", "parrot", "exotic"],
    triagePrompt: "This is an exotic pet case. Assess husbandry: enclosure, temperature, humidity, UVB, diet, substrate. Perform species-appropriate physical exam. Exotic species deteriorate quickly and mask illness. Review diet and supplementation (calcium, vitamins). Fecal exam for parasites is essential.",
    highRiskSymptoms: ["egg binding in birds/reptiles", "respiratory distress", "seizures", "anorexia >48h in small mammals", "severe trauma", "prolapse"],
    reportTemplate: REPORT_TEMPLATES["exotic-pets"],
  },
  "large-animal": {
    label: "Large Animal (Bovine, Ovine, Caprine)",
    keywords: ["cow", "cattle", "sheep", "goat", "bovine", "ovine", "caprine", "dairy", "beef", "herd", "calf", "lamb", "kid"],
    triagePrompt: "This is a large animal case. Assess individual and herd health. Signalment: species, breed, age, ID, lactation/pregnancy stage. TPR with rumen motility assessment. Evaluate production parameters: milk yield, weight gain, feed conversion. Consider herd-level diagnostics. DOCUMENT DRUG WITHDRAWAL TIMES for meat and milk.",
    highRiskSymptoms: ["down cow unable to rise", "severe colic/bloat", "dystocia", "mastitis with systemic signs", "pneumonia in calves", "scours with dehydration"],
    reportTemplate: REPORT_TEMPLATES["large-animal"],
  },
  "mixed-animal": {
    label: "Mixed Animal Practice",
    keywords: ["mixed animal", "mixed practice", "farm", "livestock", "ranch"],
    triagePrompt: "Adapt triage to the specific species presenting. Use species-appropriate vital signs, examination protocols, and treatment plans. Always consider zoonotic disease risk. Document species-specific drug dosages and withdrawal times.",
    highRiskSymptoms: ["varies by species - assess based on presenting complaint and patient type"],
    reportTemplate: REPORT_TEMPLATES["mixed-animal"],
  },
  "vet-specialty": {
    label: "Veterinary Specialty (Surgery/Ophthalmology)",
    keywords: ["vet surgery", "veterinary specialty", "animal surgery", "vet ophthalmology", "ACVS", "ACVO", "specialty vet", "animal neurologist"],
    triagePrompt: "This is a veterinary specialty case. Review referral history and prior diagnostics. For surgical cases: lameness exam, orthopedic tests (drawer sign, Ortolani, TPLO assessment), neurologic exam. For ophthalmic: STT, IOP, fluorescein, slit lamp, fundoscopy. Document surgical plan and post-operative care.",
    highRiskSymptoms: ["status epilepticus", "severe trauma with neurological deficits", "acute glaucoma with buphthalmos", "corneal perforation", "septic joint"],
    reportTemplate: REPORT_TEMPLATES["vet-specialty"],
  },
};

export function getSpecialtyForKeywords(text) {
  if (!text) return null;
  const lower = text.toLowerCase();
  let bestMatch = null;
  let maxScore = 0;

  for (const [key, template] of Object.entries(SPECIALTY_TEMPLATES)) {
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
