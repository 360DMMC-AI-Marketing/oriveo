export interface MedicalTemplate {
  id: string;
  condition: string;
  category: string;
  severity: string;
  questions: string[];
  description?: string;
}

const lastQ = "Do you have anything else you'd like to tell the doctor?";

export const medicalTemplates: MedicalTemplate[] = [
  {
    id: "diabetes", condition: "Diabetes (Type 1 & 2)", category: "Endocrinology", severity: "high",
    questions: ["Have you checked your blood sugar levels this morning?", "What was your blood sugar reading?", "Have you taken your diabetes medication today?", "Have you experienced any episodes of dizziness or weakness?", "Are you following your recommended diet plan?", "Have you noticed any tingling or numbness in your hands or feet?", "Have you had any vision changes recently?", "How many times have you had low blood sugar episodes this week?", "Are you experiencing excessive thirst or frequent urination?", "Have you been doing your foot exams regularly?", lastQ],
  },
  {
    id: "hypertension", condition: "Hypertension", category: "Cardiology", severity: "high",
    questions: ["Have you checked your blood pressure today?", "What is your current blood pressure reading?", "Are you taking your blood pressure medication regularly?", "Have you experienced any headaches or chest pain?", "Are you limiting your salt intake?", "Have you felt any shortness of breath during activities?", "Are you exercising regularly as recommended?", "Have you noticed any swelling in your ankles or feet?", "How is your stress level this week?", "Have you had any episodes of palpitations?", lastQ],
  },
  {
    id: "asthma-copd", condition: "Asthma & COPD", category: "Pulmonology", severity: "high",
    questions: ["Have you used your rescue inhaler in the past 24 hours?", "How many times have you used it?", "Are you experiencing any wheezing or coughing?", "Can you walk up a flight of stairs without getting breathless?", "Have you been exposed to any known triggers?", "Are you taking your maintenance medication daily?", "Have you had any chest tightness?", "Are you coughing up any colored mucus?", "How is your peak flow reading today?", "Have you had any emergency room visits since last checkup?", lastQ],
  },
  {
    id: "heart-disease", condition: "Heart Disease", category: "Cardiology", severity: "critical",
    questions: ["Are you experiencing any chest pain or discomfort?", "Do you feel any shortness of breath at rest?", "Are you taking your heart medications as prescribed?", "Have you noticed any irregular heartbeat?", "Can you perform your usual daily activities?", "Have you had any episodes of dizziness or fainting?", "Are you following a heart-healthy diet?", "How many times this week have you experienced chest tightness?", "Are you monitoring your weight daily?", "Have you noticed any swelling in your legs?", lastQ],
  },
  {
    id: "arthritis", condition: "Arthritis & Joint Pain", category: "Rheumatology", severity: "moderate",
    questions: ["Rate your current joint pain from 1 to 10.", "Which joints are bothering you most today?", "Are you taking your anti-inflammatory medication?", "Is your morning stiffness lasting more than 30 minutes?", "Are you able to perform your daily activities?", "Have you noticed any joint swelling or redness?", "Are you doing your recommended exercises?", "Have you had any medication side effects?", "Is the pain affecting your sleep?", "Have you needed any assistance with daily tasks?", lastQ],
  },
  {
    id: "depression-anxiety", condition: "Depression & Anxiety", category: "Psychiatry", severity: "high",
    questions: ["How would you rate your mood today from 1 to 10?", "Have you been taking your medication as prescribed?", "Are you sleeping well at night?", "Have you had any thoughts of self-harm?", "Are you attending your therapy sessions?", "Have you been feeling anxious or nervous?", "Are you eating regularly?", "Have you been able to enjoy activities you usually like?", "Are you feeling overwhelmed or hopeless?", "Have you been in contact with family or friends?", lastQ],
  },
  {
    id: "thyroid", condition: "Thyroid Disorders", category: "Endocrinology", severity: "moderate",
    questions: ["Are you taking your thyroid medication regularly?", "Have you noticed any changes in your energy levels?", "Has your weight changed significantly recently?", "Are you feeling unusually hot or cold?", "Have you noticed any changes in your heart rate?", "Are you experiencing any hair thinning or loss?", "Have you had any tremors in your hands?", "Are you having trouble concentrating?", "Have you noticed any changes in your bowel habits?", "Are you feeling more anxious or depressed than usual?", lastQ],
  },
  {
    id: "kidney-disease", condition: "Kidney Disease", category: "Nephrology", severity: "critical",
    questions: ["Are you following your renal diet?", "Have you noticed any changes in urination?", "Are you experiencing any swelling in your legs or face?", "Are you taking your blood pressure medication?", "Have you felt nauseous or lost your appetite?", "Are you experiencing any itching or skin changes?", "Have you had any muscle cramps?", "Are you monitoring your fluid intake?", "Have you been short of breath?", "Are you feeling unusually tired or weak?", lastQ],
  },
  {
    id: "pregnancy", condition: "Pregnancy Monitoring", category: "Obstetrics", severity: "high",
    questions: ["How many weeks pregnant are you?", "Have you been feeling fetal movement regularly?", "Are you taking your prenatal vitamins?", "Have you experienced any bleeding or unusual discharge?", "Are you having any contractions or cramping?", "Have you had any headaches or vision changes?", "Are you experiencing any swelling in your hands or face?", "Have you attended your scheduled prenatal appointments?", "Are you following a healthy diet?", "Do you have any concerns about your pregnancy?", lastQ],
  },
  {
    id: "post-surgery", condition: "Post-Surgery Recovery", category: "Surgery", severity: "high",
    questions: ["How many days since your surgery?", "Rate your pain level from 1 to 10.", "Is your surgical wound clean and dry?", "Are you taking your prescribed medications?", "Have you had any fever or chills?", "Are you following your activity restrictions?", "Have you noticed any redness or discharge from the wound?", "Are you able to eat and drink normally?", "Have you had a bowel movement since surgery?", "Do you have your follow-up appointment scheduled?", lastQ],
  },
  {
    id: "pediatric", condition: "Pediatric Checkup", category: "Pediatrics", severity: "moderate",
    questions: ["What is your child's current temperature?", "Has your child been eating and drinking normally?", "Is your child sleeping well?", "Has your child had any vomiting or diarrhea?", "Is your child up to date with vaccinations?", "Have you noticed any rash or skin changes?", "Is your child breathing normally?", "Has your child been meeting developmental milestones?", "Are there any behavioral concerns?", "Has your child been around anyone who was sick?", lastQ],
  },
  {
    id: "general-wellness", condition: "General Wellness", category: "General Medicine", severity: "low",
    questions: ["How would you rate your overall health today?", "Are you experiencing any new symptoms?", "Have you been eating a balanced diet?", "Are you exercising regularly?", "How many hours of sleep are you getting on average?", "Are you taking any medications or supplements?", "Have you had any recent falls or injuries?", "Are you up to date with your health screenings?", "How is your stress level?", "Do you have any health concerns you want to discuss?", lastQ],
  },
  {
    id: "cancer-followup", condition: "Cancer Follow-up", category: "Oncology", severity: "critical",
    questions: ["Are you experiencing any new pain or discomfort?", "Are you taking your medications as prescribed?", "Have you had any changes in appetite or weight?", "Are you experiencing any treatment side effects?", "Have you had any fever or infections?", "Are you keeping your scheduled appointments?", "Have you noticed any lumps or swelling?", "Are you feeling unusually tired?", "Have you had any bleeding or bruising?", "Do you have any concerns about your treatment plan?", lastQ],
  },
  {
    id: "gastrointestinal", condition: "Gastrointestinal Issues", category: "Gastroenterology", severity: "moderate",
    questions: ["Are you experiencing any abdominal pain or discomfort?", "Have you had any heartburn or acid reflux?", "Are your bowel movements regular?", "Have you noticed any blood in your stool?", "Are you following your recommended diet?", "Are you taking your GI medications?", "Have you had any nausea or vomiting?", "Are you experiencing bloating or gas?", "Has your appetite changed?", "Do you have any food triggers you have identified?", lastQ],
  },
  {
    id: "neurological", condition: "Neurological Disorders", category: "Neurology", severity: "high",
    questions: ["Have you had any headaches or migraines since last visit?", "Are you experiencing any dizziness or balance issues?", "Have you had any seizures or unusual episodes?", "Are you taking your neurological medications?", "Have you noticed any changes in your vision?", "Are you experiencing any numbness or tingling?", "Have you had any difficulty speaking or swallowing?", "Are you having trouble with memory or concentration?", "Have you experienced any muscle weakness?", "Are you able to walk without assistance?", lastQ],
  },
  {
    id: "elderly-care", condition: "Elderly Care Assessment", category: "Geriatrics", severity: "moderate",
    questions: ["Have you fallen in the past week?", "Are you able to prepare your own meals?", "Are you taking all your medications correctly?", "Have you been feeling confused or forgetful?", "Are you eating regularly and drinking enough water?", "Do you need help with bathing or dressing?", "Have you been feeling lonely or isolated?", "Are you able to get out of bed without help?", "Have you had any urinary accidents?", "Is your home safe and free of fall hazards?", lastQ],
  },
];
