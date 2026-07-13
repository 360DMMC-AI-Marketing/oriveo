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
    description: "Chronic metabolic disorder characterized by hyperglycemia from insulin deficiency or resistance. Screening includes HbA1c, fasting glucose, and assessment of microvascular complications.",
    questions: ["What was your most recent HbA1c or fasting blood sugar reading?", "Are you experiencing any symptoms of hypoglycemia or hyperglycemia?", "Have you taken your diabetes medication or insulin as prescribed today?", "Have you had any episodes of dizziness, confusion, or loss of consciousness?", "Are you following your recommended meal plan and counting carbohydrates?", "Have you noticed any vision changes, numbness, or tingling in your feet?", "Have you checked your feet for cuts, blisters, or sores this week?", "How many times have you had low blood sugar episodes in the past week?", "Are you experiencing excessive thirst, frequent urination, or unexplained weight loss?", "Have you had your annual diabetic eye exam and kidney function tests?", lastQ],
  },
  {
    id: "hypertension", condition: "Hypertension", category: "Cardiology", severity: "high",
    description: "Persistently elevated blood pressure ≥130/80 mmHg per 2025 AHA/ACC guidelines. Assessment includes home BP monitoring, CV risk calculation (PREVENT equation), and target organ damage screening.",
    questions: ["What is your current blood pressure reading and when was it taken?", "Are you taking your blood pressure medication exactly as prescribed?", "Do you monitor your blood pressure at home? What have your recent readings been?", "Have you experienced any headaches, chest pain, or shortness of breath?", "Are you limiting your sodium intake and following a DASH-style diet?", "Have you noticed any swelling in your ankles or feet?", "How many times per week do you engage in aerobic exercise?", "Have you had any episodes of palpitations or irregular heartbeat?", "Are you consuming alcohol? How many drinks per week?", "Have you had recent lab work including kidney function and cholesterol?", lastQ],
  },
  {
    id: "asthma-copd", condition: "Asthma & COPD", category: "Pulmonology", severity: "high",
    description: "Chronic airway diseases — asthma is variable airflow obstruction with airway hyperresponsiveness; COPD is progressive airflow limitation from (usually) smoking. GINA/GOLD guidelines emphasize symptom control and exacerbation prevention.",
    questions: ["How many times have you used your rescue inhaler in the past 24 hours?", "Are you waking up at night due to coughing or wheezing?", "Can you walk up one flight of stairs without stopping for breath?", "Are you taking your daily maintenance inhaler as prescribed?", "Have you been exposed to any known triggers (smoke, allergens, cold air)?", "Have you had any chest tightness or shortness of breath at rest?", "Are you coughing up any colored or increased mucus?", "What is your peak flow reading today compared to your personal best?", "Have you had any emergency visits or hospitalizations since your last visit?", "Are you using proper inhaler technique — have you demonstrated it recently?", lastQ],
  },
  {
    id: "heart-disease", condition: "Heart Disease", category: "Cardiology", severity: "critical",
    description: "Coronary artery disease, heart failure, or valvular disease. Assessment focuses on symptom burden (chest pain, dyspnea, edema), medication adherence, and functional status using NYHA classification.",
    questions: ["Are you experiencing any chest pain, pressure, or discomfort right now?", "Do you feel short of breath at rest or with minimal activity?", "Are you taking all your heart medications (antiplatelets, beta-blockers, statins) as prescribed?", "Have you noticed any irregular heartbeat, fluttering, or skipped beats?", "How many blocks can you walk before needing to stop?", "Have you had any episodes of dizziness, lightheadedness, or fainting?", "Are you monitoring your weight daily? Has it increased suddenly?", "Have you noticed new or worsening swelling in your legs or abdomen?", "Are you following a low-sodium, heart-healthy diet?", "Do you have a follow-up appointment scheduled with your cardiologist?", lastQ],
  },
  {
    id: "arthritis", condition: "Arthritis & Joint Pain", category: "Rheumatology", severity: "moderate",
    description: "Inflammatory (rheumatoid) or degenerative (osteoarthritis) joint disease. ACR guidelines emphasize treat-to-target with DMARDs for RA and functional assessment with PROMs for OA.",
    questions: ["Which joints are bothering you most today and how would you rate the pain (0-10)?", "How long does your morning stiffness last — less than or more than 30 minutes?", "Are you taking your anti-inflammatory or DMARD medication as prescribed?", "Have you noticed any joint swelling, redness, or warmth?", "Are you able to perform your usual daily activities (dressing, cooking, work)?", "Have you had any medication side effects such as nausea, fatigue, or bruising?", "Are you doing your recommended physical therapy or home exercises?", "Has the pain affected your sleep quality this week?", "Have you needed any assistance or adaptive devices for daily tasks?", "When was your last rheumatology follow-up and lab work (CRP, ESR)?", lastQ],
  },
  {
    id: "depression-anxiety", condition: "Depression & Anxiety", category: "Psychiatry", severity: "high",
    description: "Depression (PHQ-9) and generalized anxiety (GAD-7) are common mental health disorders. Screening covers mood, anhedonia, sleep, energy, concentration, and safety. Suicidal ideation requires immediate assessment.",
    questions: ["Over the past two weeks, how often have you felt down, depressed, or hopeless?", "Have you lost interest or pleasure in doing things you usually enjoy?", "Are you taking your antidepressant or anti-anxiety medication as prescribed?", "Are you attending therapy or counseling sessions regularly?", "How has your sleep been — trouble falling asleep, staying asleep, or sleeping too much?", "Have you had thoughts of harming yourself or that life isn't worth living?", "Have you been feeling anxious, nervous, or on edge most days?", "Are you worrying excessively about things that are out of your control?", "How is your appetite and energy level compared to usual?", "Are you avoiding social situations or having difficulty concentrating?", lastQ],
  },
  {
    id: "thyroid", condition: "Thyroid Disorders", category: "Endocrinology", severity: "moderate",
    description: "Hypothyroidism or hyperthyroidism affecting metabolism. ATA guidelines recommend TSH-based screening and monitoring for symptoms of hormone excess or deficiency.",
    questions: ["Are you taking your thyroid medication regularly and at the correct dose?", "Have you noticed any changes in your energy level or fatigue?", "Has your weight changed significantly — gain or loss — without trying?", "Are you feeling unusually hot or cold compared to others?", "Have you noticed changes in your heart rate — racing or slow?", "Are you experiencing any hair thinning, dry skin, or brittle nails?", "Have you had any tremors in your hands or muscle weakness?", "Have you noticed any swelling in your neck or difficulty swallowing?", "Are you having trouble with memory, concentration, or brain fog?", "When was your last thyroid function test (TSH, T4, T3) and what were the results?", lastQ],
  },
  {
    id: "kidney-disease", condition: "Kidney Disease", category: "Nephrology", severity: "critical",
    description: "Chronic kidney disease defined by GFR <60 or albuminuria >3 months. KDIGO guidelines recommend CGA staging (Cause, GFR, Albuminuria), CV risk assessment, and complication management.",
    questions: ["Are you following your renal diet (limiting salt, potassium, phosphorus)?", "Have you noticed any changes in your urination — frequency, color, or amount?", "Are you experiencing any swelling in your legs, face, or hands?", "Are you taking your blood pressure or diabetes medications as prescribed?", "Have you felt nauseous, lost your appetite, or had vomiting recently?", "Are you experiencing any itching, muscle cramps, or restless legs?", "Have you been short of breath or had difficulty catching your breath?", "Are you monitoring your fluid intake as recommended?", "Have you had your kidney function (eGFR) and urine albumin checked recently?", "Do you have a follow-up scheduled with your nephrologist?", lastQ],
  },
  {
    id: "pregnancy", condition: "Pregnancy Monitoring", category: "Obstetrics", severity: "high",
    description: "Antepartum care following ACOG guidelines. Monitoring includes fetal movement, maternal vital signs, screening for gestational diabetes, preeclampsia, and preterm labor.",
    questions: ["How many weeks pregnant are you and what is your estimated due date?", "Are you feeling regular fetal movement each day?", "Are you taking your prenatal vitamins — including folic acid and iron?", "Have you experienced any vaginal bleeding, leaking fluid, or unusual discharge?", "Are you having any contractions, cramping, or pelvic pressure?", "Have you had any headaches, vision changes, or upper abdominal pain?", "Have you noticed sudden swelling in your face, hands, or feet?", "Have you had your glucose tolerance test for gestational diabetes?", "Are you attending your scheduled prenatal appointments and ultrasounds?", "Do you feel safe at home and have a support system for delivery and postpartum?", lastQ],
  },
  {
    id: "post-surgery", condition: "Post-Surgery Recovery", category: "Surgery", severity: "high",
    description: "Post-operative recovery monitoring per ERAS protocols. Covers wound healing, pain control, return of GI function, thromboprophylaxis, and early mobilization.",
    questions: ["How many days has it been since your surgery?", "Rate your current pain level from 0 to 10 — is it controlled?", "Is your surgical incision clean, dry, and free of redness or drainage?", "Are you taking your prescribed medications — pain, antibiotics, blood thinners?", "Have you had any fever, chills, or shaking episodes?", "Are you able to walk and move around as instructed?", "Have you had a bowel movement or passed gas since surgery?", "Are you able to eat and drink without nausea or difficulty?", "Have you noticed any redness, discharge, or warmth around the incision?", "Do you have your follow-up appointment scheduled and wound care instructions?", lastQ],
  },
  {
    id: "pediatric", condition: "Pediatric Checkup", category: "Pediatrics", severity: "moderate",
    description: "Well-child visit per AAP Bright Futures guidelines. Includes developmental screening, vaccination review, growth monitoring, and anticipatory guidance for age-appropriate milestones.",
    questions: ["What is your child's current weight, height, and temperature if measured?", "Has your child been eating and drinking normally for their age?", "Is your child meeting their developmental milestones (smiling, sitting, walking, talking)?", "Has your child been sleeping well and on a regular schedule?", "Has your child had any vomiting, diarrhea, or fever recently?", "Is your child up to date on all recommended vaccinations?", "Have you noticed any rash, skin changes, or signs of allergic reaction?", "Has your child achieved age-appropriate bladder/bowel control?", "Are there any behavioral concerns — tantrums, withdrawal, aggression?", "Has your child been around anyone who was sick or had a contagious illness?", lastQ],
  },
  {
    id: "general-wellness", condition: "General Wellness", category: "General Medicine", severity: "low",
    description: "Annual preventive health assessment per USPSTF A and B recommendations. Covers health screening updates, lifestyle counseling, immunizations, and age-appropriate cancer screening.",
    questions: ["How would you rate your overall health on a scale of 1 to 10?", "Have you experienced any new or concerning symptoms since your last visit?", "Are you up to date on recommended screenings (blood pressure, cholesterol, cancer)?", "Are you physically active — how many minutes per week?", "How many hours of quality sleep do you get on average per night?", "Are you taking any medications, supplements, or herbal remedies?", "Do you use tobacco, vaping products, or recreational drugs?", "How many alcoholic drinks do you consume per week?", "Are you current on recommended immunizations (flu, COVID, others)?", "Do you have any health goals or concerns you would like to discuss today?", lastQ],
  },
  {
    id: "cancer-followup", condition: "Cancer Follow-up", category: "Oncology", severity: "critical",
    description: "Surveillance for recurrence and management of treatment-related side effects per NCCN survivorship guidelines. Includes pain assessment, new symptoms, and psychosocial support needs.",
    questions: ["Are you experiencing any new pain, lumps, or persistent symptoms?", "Are you taking all prescribed medications including cancer treatments and supportive care?", "Have you had any changes in appetite, unintentional weight loss, or gain?", "Are you experiencing any treatment side effects — fatigue, nausea, neuropathy?", "Have you had any fevers, infections, or unusual bleeding or bruising?", "Are you keeping your scheduled oncology follow-ups and imaging appointments?", "Have you noticed any new swelling in your lymph nodes or elsewhere?", "Are you feeling unusually tired or weak compared to two weeks ago?", "How is your emotional well-being — are you feeling anxious, depressed, or overwhelmed?", "Do you have a survivorship care plan and know what symptoms require immediate attention?", lastQ],
  },
  {
    id: "gastrointestinal", condition: "Gastrointestinal Issues", category: "Gastroenterology", severity: "moderate",
    description: "GI disorders including GERD, IBS, IBD, and functional dyspepsia. ACG/AGA guidelines recommend symptom-based assessment, alarm features screening (bleeding, weight loss), and appropriate endoscopic evaluation.",
    questions: ["Are you experiencing any abdominal pain — where is it and how severe?", "Have you had any heartburn, acid reflux, or regurgitation after meals?", "How would you describe your bowel movements — frequency, consistency, any blood?", "Have you noticed any blood — bright red or dark/tarry — in your stool?", "Are you following your recommended diet and avoiding trigger foods?", "Are you taking your GI medications (PPI, antispasmodics, biologics) as prescribed?", "Have you had any nausea, vomiting, or difficulty swallowing?", "Are you experiencing bloating, excessive gas, or feeling full quickly?", "Has your appetite changed or have you had unintentional weight loss?", "Have you had recent GI procedures — colonoscopy, endoscopy — and do you have results?", lastQ],
  },
  {
    id: "neurological", condition: "Neurological Disorders", category: "Neurology", severity: "high",
    description: "Neurologic conditions including headache/migraine, seizure disorders, neuropathy, and movement disorders. AAN guidelines emphasize symptom duration pattern, focal deficits, and functional impact.",
    questions: ["Have you had any new or worsening headaches, migraines, or head pain?", "Are you experiencing any dizziness, vertigo, or balance problems when walking?", "Have you had any seizures, tremors, or unusual involuntary movements?", "Are you taking your neurological medications as prescribed — including antiseizure or migraine prophylaxis?", "Have you noticed any changes in your vision — blurring, double vision, or vision loss?", "Are you experiencing any numbness, tingling, or weakness anywhere in your body?", "Have you had any difficulty speaking, swallowing, or understanding others?", "Are you having trouble with memory, concentration, or finding words?", "Have you had any falls or near-falls in the past week?", "Are you able to walk without assistance and perform your daily activities?", lastQ],
  },
  {
    id: "elderly-care", condition: "Elderly Care Assessment", category: "Geriatrics", severity: "moderate",
    description: "Comprehensive geriatric assessment per AGS guidelines. Covers fall risk, cognition, polypharmacy review (Beers Criteria), functional status (ADLs/IADLs), nutrition, and social support.",
    questions: ["Have you fallen in the past three months or do you feel unsteady when walking?", "Are you able to prepare meals, manage medications, and handle finances independently?", "Are you taking your medications correctly — do you need help organizing them?", "Have you been feeling confused, forgetful, or is your memory worse than usual?", "Are you eating regular meals and drinking enough fluids throughout the day?", "Do you need help with bathing, dressing, or getting out of bed?", "Have you been feeling lonely, isolated, or withdrawn from social activities?", "Do you have someone to call in an emergency or when you need assistance?", "Have you had any urinary leakage or accidents?", "Is your home safe — adequate lighting, grab bars in bathroom, clear walkways?", lastQ],
  },
];
