import { REPORT_TEMPLATES } from "./reportTemplates.js";
import { getConditionQuestions, detectCondition, getAllConditionKeys, getConditionNames } from "./specialtyConditions.js";

export const SPECIALTY_TEMPLATES = {
  "general-practice": {
    label: "General Practice / Family Medicine",
    keywords: ["fever", "cough", "cold", "flu", "sore throat", "rash", "checkup", "physical", "infection", "sick", "general", "family medicine"],
    triagePrompt: "Standard triage assessment for general medical concerns. Assess vital signs, chief complaint, and risk factors. Consider common conditions: URI, UTI, gastroenteritis, skin infections, hypertension, diabetes management.",
    highRiskSymptoms: ["chest pain", "difficulty breathing", "severe bleeding", "loss of consciousness", "severe allergic reaction", "high fever with stiff neck"],
    reportTemplate: REPORT_TEMPLATES["general-practice"],
    questions: [
      "How are you feeling overall today?",
      "Have you had any fever, cough, sore throat, or cold symptoms recently?",
      "Do you have any pain or discomfort anywhere in your body?",
      "Are you taking all your medications as prescribed?",
      "How has your appetite and sleep been?",
      "Have you noticed any new symptoms or changes in your health since your last visit?",
      "Do you have any specific concerns you'd like to discuss with your doctor?",
    ],
  },
  "cardiology": {
    label: "Cardiology",
    keywords: ["chest pain", "heart", "palpitations", "shortness of breath", "cardiac", "blood pressure", "hypertension", "heart attack", "chest tightness", "swelling ankles", "heart failure"],
    triagePrompt: "This is a potential cardiac case. Chest pain requires immediate attention to rule out myocardial infarction. Ask about radiation to arm/jaw, shortness of breath, diaphoresis, nausea. Consider angina vs MI. Check cardiac history and risk factors. Assess for heart failure symptoms: orthopnea, PND, edema.",
    highRiskSymptoms: ["chest pain with radiation", "shortness of breath at rest", "syncope", "palpitations with dizziness", "severe hypertension >180/120", "crushing chest pressure"],
    reportTemplate: REPORT_TEMPLATES["cardiology"],
    questions: [
      "Have you experienced any chest pain, pressure, or discomfort recently?",
      "Do you ever feel short of breath during activity or while resting?",
      "Have you noticed any palpitations, fluttering, or irregular heartbeats?",
      "Do you have any swelling in your ankles, feet, or legs?",
      "Are you taking your heart medications and blood pressure medications as prescribed?",
      "Have you felt dizzy, lightheaded, or fainted recently?",
      "Have you checked your blood pressure at home? What was it?",
    ],
  },
  "pediatrics": {
    label: "Pediatrics",
    keywords: ["child", "baby", "infant", "toddler", "newborn", "fever in child", "my kid", "my son", "my daughter", "teething", "ear infection"],
    triagePrompt: "This is a pediatric case. Children can deteriorate faster than adults. Pay special attention to fever, dehydration, breathing difficulty, and rash with fever. Weight-based medication dosing is critical. Always consider Kawasaki disease, meningitis, and RSV in young children. Assess feeding, urine output, activity level.",
    highRiskSymptoms: ["high fever in infant under 3 months", "difficulty breathing", "lethargy", "not drinking", "purple rash", "seizure", "dehydration", "grunting respirations"],
    reportTemplate: REPORT_TEMPLATES["pediatrics"],
    questions: [
      "How is your child feeling today?",
      "Have they had any fever recently? What was the highest temperature?",
      "Are they eating, drinking, and urinating normally?",
      "Have they been more fussy or lethargic than usual?",
      "Any cough, congestion, or difficulty breathing?",
      "Have they had any vomiting or diarrhea?",
      "Are their immunizations up to date?",
    ],
  },
  "neurology": {
    label: "Neurology",
    keywords: ["headache", "migraine", "dizziness", "vertigo", "numbness", "tingling", "seizure", "stroke", "facial droop", "slurred speech", "confusion", "head injury", "memory loss"],
    triagePrompt: "This is a potential neurological case. Assess for stroke symptoms using FAST: Facial drooping, Arm weakness, Speech difficulty, Time to call emergency. Headache with neurological signs requires urgent imaging. Differentiate migraine from subarachnoid hemorrhage. Seizure assessment: first-time vs known epilepsy, post-ictal state.",
    highRiskSymptoms: ["sudden severe headache", "facial droop", "arm weakness", "slurred speech", "seizure >5 minutes", "loss of consciousness", "head injury with confusion", "sudden vision loss"],
    reportTemplate: REPORT_TEMPLATES["neurology"],
    questions: [
      "Have you had any headaches or migraines recently? How severe on a scale of 1 to 10?",
      "Do you experience any dizziness, vertigo, or feeling like the room is spinning?",
      "Have you noticed any numbness, tingling, or weakness in your face, arms, or legs?",
      "Any changes in your vision, speech, or ability to speak clearly?",
      "Have you had any seizures, tremor, or loss of consciousness?",
      "Are you having any trouble with memory, concentration, or confusion?",
      "Have you had any recent head injuries or falls?",
    ],
  },
  "psychiatry": {
    label: "Psychiatry / Behavioral Health",
    keywords: ["anxiety", "depression", "suicidal", "panic attack", "mental health", "crisis", "self-harm", "psychiatric", "bipolar", "schizophrenia", "hallucination", "mood", "therapy"],
    triagePrompt: "This is a mental health case. Assess for immediate danger to self or others. Ask about suicidal ideation, plan, intent, means, and protective factors. Use a calm, non-judgmental approach. Have crisis resources ready: 988 Suicide & Crisis Lifeline. Differentiate panic attack from cardiac emergency. Screen for substance use.",
    highRiskSymptoms: ["suicidal ideation with plan", "active self-harm", "hearing voices commanding harm", "aggressive behavior", "acute psychosis", "mania with poor judgment"],
    crisisResources: { national: "988 Suicide & Crisis Lifeline", emergency: "Call 911 or go to nearest ER" },
    reportTemplate: REPORT_TEMPLATES["psychiatry"],
    questions: [
      "How have you been feeling emotionally over the past week?",
      "How is your sleep — are you sleeping too much, too little, or having trouble falling asleep?",
      "How is your appetite and energy level?",
      "Are you taking your medications as prescribed?",
      "Have you had any thoughts of harming yourself or others?",
      "Have you been feeling anxious, on edge, or having panic attacks?",
      "Are you seeing a therapist or counselor regularly?",
    ],
  },
  "dermatology": {
    label: "Dermatology",
    keywords: ["rash", "skin", "mole", "lesion", "itching", "eczema", "psoriasis", "acne", "skin cancer", "biopsy", "derm", "sun damage", "wart", "fungal"],
    triagePrompt: "This is a dermatological case. Assess rash: onset, duration, distribution, morphology (macules, papules, vesicles, pustules), pruritus, pain. Use ABCDE for pigmented lesions: Asymmetry, Border irregularity, Color variation, Diameter >6mm, Evolution. Consider cellulitis vs contact dermatitis vs shingles.",
    highRiskSymptoms: ["rash with fever", "rapidly spreading redness", "blistering over large area", "skin necrosis", "lesion changing rapidly"],
    reportTemplate: REPORT_TEMPLATES["dermatology"],
    questions: [
      "What skin concern are you experiencing? Can you describe it?",
      "When did this skin issue first appear?",
      "Is it itchy, painful, or burning?",
      "Have you noticed any changes in a mole — size, shape, color, or bleeding?",
      "Have you had any fever or other symptoms along with the rash?",
      "Are you using any creams, medications, or new skincare products?",
      "Do you have a history of skin cancer or sun damage?",
    ],
  },
  "therapy": {
    label: "Physical / Occupational / Speech Therapy",
    keywords: ["physical therapy", "occupational therapy", "speech therapy", "rehab", "rehabilitation", "exercise", "mobility", "range of motion", "muscle weakness", "gait", "swallowing", "speech"],
    triagePrompt: "This is a therapy/rehabilitation case. Assess functional limitations: mobility, ADLs, communication, swallowing. Document objective measures: ROM, MMT, Berg balance, gait analysis, pain scale. Track progress toward functional goals. Apply 8-minute billing rule for timed units.",
    highRiskSymptoms: ["sudden loss of function", "acute fall with injury", "new difficulty swallowing", "sudden speech loss", "severe pain limiting movement"],
    reportTemplate: REPORT_TEMPLATES["therapy"],
    questions: [
      "How is your pain level today on a scale of 0 to 10?",
      "Are you able to perform your daily activities like walking, dressing, and bathing independently?",
      "Have you had any falls or near-falls since your last visit?",
      "Are you doing your home exercise program as recommended? How often?",
      "Have you noticed any improvement or worsening in your strength or mobility?",
      "Do you have any difficulty with balance, swallowing, or speaking?",
      "What are your therapy goals — what do you want to be able to do that you can't do now?",
    ],
  },
  "gastroenterology": {
    label: "Gastroenterology",
    keywords: ["stomach pain", "abdominal pain", "nausea", "vomiting", "diarrhea", "constipation", "blood in stool", "heartburn", "indigestion", "colonoscopy", "IBD", "Crohn's", "ulcerative colitis"],
    triagePrompt: "This is a potential gastrointestinal case. Assess for peritonitis, appendicitis, pancreatitis, cholecystitis, gastroenteritis, or GI bleeding. Evaluate location, nature, and radiation of pain, associated symptoms, and risk factors. Use Rome IV criteria for functional disorders.",
    highRiskSymptoms: ["blood in vomit", "blood in stool (melena/hematochezia)", "severe abdominal pain with rigidity", "bilious vomiting", "inability to pass gas/stool", "peritoneal signs"],
    reportTemplate: REPORT_TEMPLATES["gastroenterology"],
    questions: [
      "Do you have any abdominal pain or discomfort? Where is it located?",
      "Have you had any nausea, vomiting, diarrhea, or constipation recently?",
      "Have you noticed any blood in your vomit or stool?",
      "Do you experience heartburn, indigestion, or acid reflux regularly?",
      "Has your appetite changed? Are you losing weight unintentionally?",
      "Do you have any known GI conditions like Crohn's, colitis, or IBS?",
      "When was your last colonoscopy or endoscopy?",
    ],
  },
  "endocrinology": {
    label: "Endocrinology",
    keywords: ["diabetes", "thyroid", "hormone", "insulin", "blood sugar", "glucose", "HbA1c", "osteoporosis", "calcium", "adrenal", "pituitary", "testosterone", "estrogen"],
    triagePrompt: "This is an endocrine case. Assess glycemic control: HbA1c, hypoglycemic episodes, DKA risk. For thyroid: hyperthyroid vs hypothyroid symptoms. For bone health: fracture risk, falls. Check medication adherence and monitoring frequency.",
    highRiskSymptoms: ["hypoglycemia with altered mental status", "DKA symptoms", "thyroid storm symptoms", "adrenal crisis symptoms", "severe hypercalcemia"],
    reportTemplate: REPORT_TEMPLATES["endocrinology"],
    questions: [
      "How is your blood sugar control? What were your recent readings?",
      "Are you taking your diabetes or thyroid medications as prescribed?",
      "Have you had any episodes of low blood sugar — feeling shaky, sweaty, or confused?",
      "Have you noticed any unusual fatigue, weight changes, or temperature sensitivity?",
      "When was your last HbA1c or thyroid function test?",
      "Do you check your blood sugar or blood pressure at home regularly?",
      "Have you had any bone fractures or falls recently?",
    ],
  },
  "oncology": {
    label: "Oncology",
    keywords: ["cancer", "tumor", "chemotherapy", "radiation", "oncology", "malignancy", "biopsy", "metastasis", "immunotherapy", "palliative", "hospice"],
    triagePrompt: "This is an oncology case. Assess treatment tolerance, side effects, and disease status. Check for neutropenic fever (oncologic emergency), treatment toxicity per CTCAE v5, and performance status (ECOG). Review current regimen and cycle. Evaluate pain management needs.",
    highRiskSymptoms: ["neutropenic fever", "severe treatment side effects", "new neurological symptoms", "sepsis symptoms", "uncontrolled pain", "suicidal ideation"],
    reportTemplate: REPORT_TEMPLATES["oncology"],
    questions: [
      "How are you feeling overall since your last treatment?",
      "Are you experiencing any side effects from your treatment — nausea, fatigue, pain, or fever?",
      "Have you had any fever, chills, or signs of infection recently?",
      "Are you able to perform your usual daily activities?",
      "How is your pain level on a scale of 0 to 10? Is it well controlled?",
      "Are you taking all your medications as prescribed?",
      "Do you have any upcoming appointments or scans scheduled?",
    ],
  },
  "rheumatology": {
    label: "Rheumatology",
    keywords: ["joint pain", "arthritis", "rheumatoid", "lupus", "gout", "autoimmune", "inflammation", "DMARD", "biologic", "vasculitis", "scleroderma"],
    triagePrompt: "This is a rheumatology case. Assess joint distribution (symmetrical/asymmetrical, small/large), duration of morning stiffness, inflammatory vs mechanical pain. Calculate DAS28. Check for extra-articular manifestations. Review DMARD/biologic therapy and monitoring labs.",
    highRiskSymptoms: ["severe joint pain with swelling", "new organ involvement symptoms", "vasculitic rash", "monocular vision loss", "acute monoarticular arthritis with fever"],
    reportTemplate: REPORT_TEMPLATES["rheumatology"],
    questions: [
      "Which joints are bothering you most today?",
      "How long does your morning stiffness last — more or less than 30 minutes?",
      "How is your pain level on a scale of 0 to 10?",
      "Are you taking your arthritis medications or biologics on schedule?",
      "Have you noticed any new rashes, swelling, or other symptoms?",
      "Do you have any difficulty with daily activities like opening jars or walking?",
      "When were your last lab tests — and how were the results?",
    ],
  },
  "nephrology": {
    label: "Nephrology",
    keywords: ["kidney", "dialysis", "creatinine", "GFR", "renal", "CKD", "nephrology", "electrolyte", "hemodialysis", "peritoneal dialysis", "transplant"],
    triagePrompt: "This is a nephrology case. Assess volume status, electrolyte balance, and dialysis adequacy. For CKD: stage, etiology, progression. For dialysis: access type, Kt/V, UF goals. For transplant: immunosuppression, rejection signs, graft function.",
    highRiskSymptoms: ["hyperkalemia with ECG changes", "severe volume overload", "uremic symptoms", "dialysis access complications", "transplant rejection signs"],
    reportTemplate: REPORT_TEMPLATES["nephrology"],
    questions: [
      "How have you been feeling since your last visit?",
      "Are you experiencing any swelling in your legs, face, or hands?",
      "Do you have any shortness of breath or trouble breathing?",
      "Are you following your fluid and dietary restrictions?",
      "If on dialysis: how have your treatments been going? Any issues with your access site?",
      "If you have a transplant: any signs of rejection — fever, pain, decreased urine output?",
      "Are you taking all your medications as prescribed?",
    ],
  },
  "pulmonology": {
    label: "Pulmonology",
    keywords: ["asthma", "COPD", "cough", "wheezing", "shortness of breath", "pulmonary", "lung", "spirometry", "pneumonia", "sleep apnea", "oxygen"],
    triagePrompt: "This is a respiratory case. Assess breathing rate, O2 saturation, ability to speak in full sentences, use of accessory muscles. Differentiate upper vs lower respiratory tract infection. Consider asthma exacerbation, COPD exacerbation, pneumonia, PE. Use mMRC dyspnea scale. Check smoking history.",
    highRiskSymptoms: ["cannot speak full sentences", "blue lips/cyanosis", "chest retractions", "stridor", "hemoptysis", "respiratory rate >30", "O2 sat <90%"],
    reportTemplate: REPORT_TEMPLATES["pulmonology"],
    questions: [
      "How is your breathing today? Any shortness of breath or wheezing?",
      "Do you have a cough? Is it dry or producing phlegm?",
      "Are you using your inhalers as prescribed? How often?",
      "Do you use oxygen at home? At what flow rate?",
      "Have you had any chest infections or pneumonia recently?",
      "Are you able to walk up a flight of stairs without getting winded?",
      "Do you smoke or have you smoked in the past?",
    ],
  },
  "ophthalmology": {
    label: "Ophthalmology",
    keywords: ["eye", "vision", "blurry", "vision loss", "red eye", "eye pain", "floater", "glaucoma", "cataract", "retina", "dry eye", "conjunctivitis"],
    triagePrompt: "This is an ophthalmic case. Assess visual acuity, pain, redness, discharge, photophobia, flashing lights/floaters. Check for red flags: sudden vision loss, eye pain with nausea/vomiting (possible acute angle closure glaucoma), chemical exposure, foreign body. Measure IOP if indicated.",
    highRiskSymptoms: ["sudden vision loss", "eye pain with nausea/vomiting", "chemical eye exposure", "penetrating eye injury", "new onset floaters with flashes"],
    reportTemplate: REPORT_TEMPLATES["ophthalmology"],
    questions: [
      "Do you have any issues with your vision — blurriness, double vision, or vision loss?",
      "Do you have any eye pain, redness, or discharge?",
      "Have you noticed any new floaters, flashes of light, or shadows in your vision?",
      "Do you wear glasses or contact lenses? Is your prescription up to date?",
      "Do you have any chronic eye conditions like glaucoma, cataracts, or macular degeneration?",
      "When was your last eye exam?",
      "Do you have dry eyes or use eye drops regularly?",
    ],
  },
  "ent": {
    label: "ENT / Otolaryngology",
    keywords: ["ear", "hearing", "tinnitus", "vertigo", "sinus", "sore throat", "hoarseness", "tonsil", "thyroid", "neck mass", "allergy", "nasal"],
    triagePrompt: "This is an ENT case. Assess ear pain, hearing loss, vertigo, nasal obstruction/sinus pain, sore throat, hoarseness, neck mass. For sore throat: Centor criteria for strep. For vertigo: positional vs continuous, nystagmus, Dix-Hallpike. For hearing: audiometry, tuning fork tests.",
    highRiskSymptoms: ["airway compromise", "stridor", "severe sore throat with muffled voice/drooling", "facial nerve paralysis", "sudden hearing loss", "neck mass with rapid growth"],
    reportTemplate: REPORT_TEMPLATES["ent"],
    questions: [
      "Are you experiencing any ear pain, hearing loss, or ringing in your ears?",
      "Do you have any sinus pain, nasal congestion, or post-nasal drip?",
      "Do you have a sore throat, hoarseness, or difficulty swallowing?",
      "Have you had any dizziness or vertigo — a spinning sensation?",
      "Have you noticed any lumps or swelling in your neck?",
      "Do you have any allergies or hay fever?",
      "Have you had any hearing tests or sinus imaging recently?",
    ],
  },
  "general-dentistry": {
    label: "General Dentistry",
    keywords: ["tooth", "teeth", "dental", "cavity", "filling", "crown", "cleaning", "gum", "mouth", "oral", "dentist"],
    triagePrompt: "This is a dental case. Assess tooth pain: onset, triggers (hot/cold/sweet/biting), spontaneous pain, swelling. Review dental history, prior restorations, oral hygiene. Perform intraoral exam, periodontal charting, and radiographic assessment. Use ADA tooth numbering. Apply caries risk assessment and periodontal staging.",
    highRiskSymptoms: ["facial swelling compromising airway", "severe dental infection spreading", "trauma with avulsed tooth", "bleeding disorder with dental emergency", "osteonecrosis risk"],
    reportTemplate: REPORT_TEMPLATES["general-dentistry"],
    questions: [
      "Do you have any tooth pain or sensitivity? Which tooth?",
      "Do your gums bleed when you brush or floss?",
      "When was your last dental cleaning?",
      "Do you have any broken teeth, loose fillings, or damaged crowns?",
      "How often do you brush and floss?",
      "Do you smoke or use tobacco products?",
      "Do you have any upcoming dental treatments scheduled?",
    ],
  },
  "orthodontics": {
    label: "Orthodontics",
    keywords: ["braces", "orthodontic", "retainer", "aligner", "malocclusion", "bite", "crowding", "overbite", "overjet", "Invisalign", "headgear"],
    triagePrompt: "This is an orthodontic case. Assess malocclusion: Angle classification, overjet, overbite, crossbite, crowding. Review treatment stage, appliance condition (wire size, bracket integrity, elastics compliance). Cephalometric analysis for skeletal assessment. Monitor PAR score progress.",
    highRiskSymptoms: ["severe pain from archwire", "bracket/band causing oral ulceration", "swelling from infection", "trauma to orthodontic appliance", "temporomandibular joint symptoms"],
    reportTemplate: REPORT_TEMPLATES["orthodontics"],
    questions: [
      "Are you experiencing any pain or discomfort from your braces or aligners?",
      "Do you have any broken brackets, poking wires, or loose bands?",
      "Are you wearing your elastics as directed? How many hours per day?",
      "Do you have any difficulty eating or chewing?",
      "Are you keeping up with your oral hygiene around your appliances?",
      "When is your next adjustment appointment?",
      "Are you satisfied with your treatment progress so far?",
    ],
  },
  "endodontics": {
    label: "Endodontics",
    keywords: ["root canal", "tooth pain", "endodontic", "pulp", "abscess tooth", "nerve tooth", "apicoectomy"],
    triagePrompt: "This is an endodontic case. Assess tooth-specific pain: spontaneous, nocturnal, thermal sensitivity, percussion sensitivity. Perform diagnostic testing: cold/heat, EPT, percussion, palpation. Review radiographs: caries depth, pulp morphology, periapical pathology, root anatomy. Classify pulpal and periapical diagnosis per AAE standards.",
    highRiskSymptoms: ["facial swelling with systemic symptoms", "spreading infection", "severe uncontrolled pain", "trauma with tooth displacement"],
    reportTemplate: REPORT_TEMPLATES["endodontics"],
    questions: [
      "Which tooth is bothering you? Can you point to it?",
      "Is the pain constant or does it come and go?",
      "Does the pain wake you up at night?",
      "Does hot or cold food/drink make the pain worse?",
      "Do you have any swelling in your face or gums near the tooth?",
      "Have you had a root canal on this tooth before?",
      "Are you taking any pain medication or antibiotics for this?",
    ],
  },
  "periodontics": {
    label: "Periodontics",
    keywords: ["gum", "periodontal", "gum disease", "recession", "bleeding gums", "deep cleaning", "SRP", "perio", "flap surgery"],
    triagePrompt: "This is a periodontal case. Assess full-mouth 6-point probing depths, BOP, recession, CAL, furcation, mobility, mucogingival status. Evaluate risk factors: smoking, diabetes, genetics, medications. Classify per AAP 2018: staging (I-IV) and grading (A-C). Review radiographic bone levels.",
    highRiskSymptoms: ["acute periodontal abscess", "rapid bone loss", "tooth mobility worsening", "severe gingival bleeding with systemic symptoms"],
    reportTemplate: REPORT_TEMPLATES["periodontics"],
    questions: [
      "Do your gums bleed when you brush or floss?",
      "Have you noticed your gums receding or teeth looking longer?",
      "Do you have any loose teeth or spaces opening up between teeth?",
      "Do you have any pain, swelling, or pus in your gums?",
      "Do you smoke or have diabetes?",
      "When was your last deep cleaning (scaling and root planing)?",
      "Are you doing any special gum care routine at home?",
    ],
  },
  "oral-surgery": {
    label: "Oral Surgery",
    keywords: ["extraction", "wisdom tooth", "oral surgery", "impacted", "biopsy oral", "jaw surgery", "implant", "dental implant"],
    triagePrompt: "This is an oral surgery case. Assess surgical need: impacted teeth, pathology, implant site, orthognathic indication. Review medical history: ASA classification, anticoagulants, bisphosphonates, anesthesia risk. Evaluate imaging: panoramic, CBCT. Document surgical plan and post-operative instructions.",
    highRiskSymptoms: ["severe post-operative bleeding", "surgical site infection with swelling", "difficulty breathing after surgery", "nerve paresthesia", "osteonecrosis"],
    reportTemplate: REPORT_TEMPLATES["oral-surgery"],
    questions: [
      "Are you having any pain or issues related to a recent surgery?",
      "Any bleeding, swelling, or signs of infection at the surgical site?",
      "Are you able to eat and drink normally?",
      "Are you taking any pain medications or antibiotics as prescribed?",
      "Do you have any numbness or tingling in your lip, chin, or tongue?",
      "Do you smoke or use tobacco — this affects healing after oral surgery?",
      "Do you have your follow-up appointment scheduled?",
    ],
  },
  "prosthodontics": {
    label: "Prosthodontics",
    keywords: ["denture", "partial", "bridge", "crown", "implant crown", "prosthetic", "prosthodontic", "false teeth", "restoration"],
    triagePrompt: "This is a prosthodontic case. Assess edentulous ridge, residual ridge classification, undercuts, occlusion, interarch space. Evaluate abutments: crown-to-root ratio, periodontal health, implant stability. Select restorative materials. Kennedy classification for RPD design.",
    highRiskSymptoms: ["ill-fitting denture causing trauma", "broken prosthesis with sharp edges", "implant mobility", "severe sore spots"],
    reportTemplate: REPORT_TEMPLATES["prosthodontics"],
    questions: [
      "Are your dentures, partials, or bridges fitting comfortably?",
      "Do you have any sore spots or irritation from your prosthesis?",
      "Are you able to chew and eat comfortably with your restoration?",
      "Have you noticed any cracks, chips, or looseness in your crown, bridge, or implant?",
      "How is your speech with your current prosthesis?",
      "Are you using dental adhesive? How often?",
      "When was your last prosthodontic adjustment or checkup?",
    ],
  },
  "pediatric-dentistry": {
    label: "Pediatric Dentistry",
    keywords: ["child tooth", "kid tooth", "baby tooth", "pediatric dental", "children's dentist", "sealant", "fluoride child"],
    triagePrompt: "This is a pediatric dental case. Assess dental development (primary/mixed/permanent), eruption status, caries risk per AAPD C.R.A.T. Behavioral assessment (Frankl scale). Age-appropriate preventive care: fluoride varnish, sealants. Consider need for sedation/GA for treatment. Dietary and habit counseling.",
    highRiskSymptoms: ["dental trauma with avulsed/permanent tooth", "swelling from dental infection", "pain unresponsive to medication", "early childhood caries with pain"],
    reportTemplate: REPORT_TEMPLATES["pediatric-dentistry"],
    questions: [
      "Is your child having any tooth pain or discomfort?",
      "Have they lost any baby teeth recently or are any permanent teeth coming in?",
      "Do they brush their teeth with your help? How often?",
      "Do they have any habits like thumb sucking or using a pacifier?",
      "Have they had any falls or injuries to their mouth or teeth?",
      "When was their last dental checkup?",
      "Have they had fluoride treatment or dental sealants applied?",
    ],
  },
  "small-animal": {
    label: "Small Animal (Dogs & Cats)",
    keywords: ["dog", "cat", "puppy", "kitten", "veterinary", "vet", "rabies", "heartworm", "flea", "tick", "pet", "animal"],
    triagePrompt: "This is a small animal veterinary case. Assess signalment: species, breed, age, sex, weight, BCS. Perform TPR and full physical exam by systems. Review vaccination status, parasite prevention, diet. Consider species-specific conditions: heartworm in dogs, FIV/FeLV in cats, urinary obstruction in male cats.",
    highRiskSymptoms: ["gastric dilation-volvulus (bloat)", "urinary obstruction", "seizure", "trauma with open fracture", "toxin ingestion", "heat stroke", "dystocia"],
    reportTemplate: REPORT_TEMPLATES["small-animal"],
    questions: [
      "How is [pet name] doing today? Any changes in behavior or energy?",
      "Are they eating and drinking normally?",
      "Have they had any vomiting, diarrhea, or changes in urination?",
      "Are they on heartworm prevention and flea/tick control?",
      "Are their vaccinations up to date?",
      "Have they had any limping, coughing, sneezing, or skin issues?",
      "When was their last wellness exam?",
    ],
  },
  "equine": {
    label: "Equine (Horses)",
    keywords: ["horse", "equine", "foal", "mare", "stallion", "colic", "lameness horse", "farrier", "coggins", "equestrian"],
    triagePrompt: "This is an equine case. Assess signalment: breed, age, use (pleasure/race/show/breeding), vaccination/deworming/Coggins status. Perform TPR: normal ranges differ from small animal. Lameness exam per AAEP scale 0-5. Evaluate colic: pain level, gut sounds, manure, heart rate, respiratory rate, CRT. Dental float assessment.",
    highRiskSymptoms: ["severe colic with elevated HR >60", "laminitis/founder", "severe laceration with joint involvement", "sepsis in foal", "eye injury/corneal ulcer"],
    reportTemplate: REPORT_TEMPLATES["equine"],
    questions: [
      "How is [horse name] doing today? Any changes in behavior or appetite?",
      "Are they passing manure normally? Any signs of colic — pawing, rolling, looking at flanks?",
      "Have you noticed any lameness or changes in gait?",
      "Are their vaccinations and Coggins test up to date?",
      "When was their last deworming and dental float?",
      "Is the farrier schedule on track? Any hoof issues?",
      "Are they eating and drinking normally? Any weight changes?",
    ],
  },
  "exotic-pets": {
    label: "Exotic Pets (Avian, Reptile, Small Mammal)",
    keywords: ["bird", "reptile", "snake", "lizard", "turtle", "rabbit", "guinea pig", "hamster", "ferret", "chinchilla", "parrot", "exotic"],
    triagePrompt: "This is an exotic pet case. Assess husbandry: enclosure, temperature, humidity, UVB, diet, substrate. Perform species-appropriate physical exam. Exotic species deteriorate quickly and mask illness. Review diet and supplementation (calcium, vitamins). Fecal exam for parasites is essential.",
    highRiskSymptoms: ["egg binding in birds/reptiles", "respiratory distress", "seizures", "anorexia >48h in small mammals", "severe trauma", "prolapse"],
    reportTemplate: REPORT_TEMPLATES["exotic-pets"],
    questions: [
      "How is [pet name] doing? Any changes in behavior, appetite, or activity?",
      "Are they eating and drinking normally? Any weight loss?",
      "What is their enclosure setup — temperature, humidity, lighting?",
      "Are they having normal urination and defecation?",
      "Have you noticed any discharge from eyes, nose, or mouth?",
      "Are they on the correct diet and supplements (calcium, vitamins)?",
      "When was their last veterinary checkup and fecal test?",
    ],
  },
  "large-animal": {
    label: "Large Animal (Bovine, Ovine, Caprine)",
    keywords: ["cow", "cattle", "sheep", "goat", "bovine", "ovine", "caprine", "dairy", "beef", "herd", "calf", "lamb", "kid"],
    triagePrompt: "This is a large animal case. Assess individual and herd health. Signalment: species, breed, age, ID, lactation/pregnancy stage. TPR with rumen motility assessment. Evaluate production parameters: milk yield, weight gain, feed conversion. Consider herd-level diagnostics. DOCUMENT DRUG WITHDRAWAL TIMES for meat and milk.",
    highRiskSymptoms: ["down cow unable to rise", "severe colic/bloat", "dystocia", "mastitis with systemic signs", "pneumonia in calves", "scours with dehydration"],
    reportTemplate: REPORT_TEMPLATES["large-animal"],
    questions: [
      "How is the animal doing? Any changes in appetite, milk production, or behavior?",
      "Are they eating, drinking, and ruminating normally?",
      "Any signs of lameness, coughing, nasal discharge, or diarrhea?",
      "For dairy: any drop in milk yield or changes in milk quality?",
      "Are vaccinations and parasite control up to date for the herd?",
      "Is the animal pregnant or recently gave birth? Any complications?",
      "Are there any other animals in the herd showing similar signs?",
    ],
  },
  "mixed-animal": {
    label: "Mixed Animal Practice",
    keywords: ["mixed animal", "mixed practice", "farm", "livestock", "ranch"],
    triagePrompt: "Adapt triage to the specific species presenting. Use species-appropriate vital signs, examination protocols, and treatment plans. Always consider zoonotic disease risk. Document species-specific drug dosages and withdrawal times.",
    highRiskSymptoms: ["varies by species - assess based on presenting complaint and patient type"],
    reportTemplate: REPORT_TEMPLATES["mixed-animal"],
    questions: [
      "How is the animal doing today? What species and breed?",
      "What is the main concern you have about this animal?",
      "Are they eating, drinking, and behaving normally for their species?",
      "Have you noticed any injuries, lameness, or changes in movement?",
      "Any coughing, nasal discharge, diarrhea, or other symptoms?",
      "Are vaccinations and parasite prevention up to date?",
      "Are there other animals on the premises with similar signs?",
    ],
  },
  "vet-specialty": {
    label: "Veterinary Specialty (Surgery/Ophthalmology)",
    keywords: ["vet surgery", "veterinary specialty", "animal surgery", "vet ophthalmology", "ACVS", "ACVO", "specialty vet", "animal neurologist"],
    triagePrompt: "This is a veterinary specialty case. Review referral history and prior diagnostics. For surgical cases: lameness exam, orthopedic tests (drawer sign, Ortolani, TPLO assessment), neurologic exam. For ophthalmic: STT, IOP, fluorescein, slit lamp, fundoscopy. Document surgical plan and post-operative care.",
    highRiskSymptoms: ["status epilepticus", "severe trauma with neurological deficits", "acute glaucoma with buphthalmos", "corneal perforation", "septic joint"],
    reportTemplate: REPORT_TEMPLATES["vet-specialty"],
    questions: [
      "How is [pet name] doing since their procedure or diagnosis?",
      "Any changes in their condition — improvement or worsening?",
      "Are they comfortable? Is their pain well managed?",
      "For surgical cases: how is the incision site healing? Any discharge or swelling?",
      "For ophthalmic cases: any changes in vision, eye discharge, squinting, or redness?",
      "Are they eating, drinking, and moving normally?",
      "When is their follow-up appointment scheduled?",
    ],
  },
};

const PATIENT_SPECIALTY_MAP = {
  "general": "general-practice",
  "cardiology": "cardiology",
  "endocrinology": "endocrinology",
  "dentistry": "general-dentistry",
  "orthopedics": "general-practice",
  "veterinary": "small-animal",
  "pediatrics": "pediatrics",
};

export function resolveSpecialty(specialty, clinicType) {
  if (SPECIALTY_TEMPLATES[specialty]) return specialty;
  if (PATIENT_SPECIALTY_MAP[specialty]) return PATIENT_SPECIALTY_MAP[specialty];
  if (clinicType === "dental") return "general-dentistry";
  if (clinicType === "veterinary") return "small-animal";
  return "general-practice";
}

export function getSpecialtyQuestions(specialty, clinicType) {
  const resolved = resolveSpecialty(specialty, clinicType);
  const template = SPECIALTY_TEMPLATES[resolved];
  return template?.questions || SPECIALTY_TEMPLATES["general-practice"].questions;
}

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

export function getQuestionsForCall(specialty, clinicType, patientTranscript = "") {
  const resolved = resolveSpecialty(specialty, clinicType);
  const conditionKey = patientTranscript ? detectCondition(resolved, patientTranscript) : null;
  if (conditionKey) {
    const conditionQuestions = getConditionQuestions(resolved, conditionKey);
    if (conditionQuestions) {
      return { questions: conditionQuestions.questions, condition: conditionKey, template: conditionQuestions.name };
    }
  }
  return { questions: SPECIALTY_TEMPLATES[resolved]?.questions || SPECIALTY_TEMPLATES["general-practice"].questions, condition: null, template: null };
}

export { getConditionQuestions, detectCondition, getAllConditionKeys, getConditionNames }; 
