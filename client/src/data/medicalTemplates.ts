export interface MedicalTemplate {
  id: string;
  condition: string;
  category: string;
  severity: string;
  questions: string[];
  description?: string;
  specialties: string[];
}

const lastQ = "Do you have anything else you'd like to tell the doctor?";

export const medicalTemplates: MedicalTemplate[] = [
  // ── General Practice ──────────────────────────────────────────────
  {
    id: "general-wellness", condition: "General Wellness", category: "General Medicine", severity: "low",
    description: "Annual preventive health assessment per USPSTF A and B recommendations. Covers health screening updates, lifestyle counseling, immunizations, and age-appropriate cancer screening.",
    questions: ["How would you rate your overall health on a scale of 1 to 10?", "Have you experienced any new or concerning symptoms since your last visit?", "Are you up to date on recommended screenings (blood pressure, cholesterol, cancer)?", "Are you physically active — how many minutes per week?", "How many hours of quality sleep do you get on average per night?", "Are you taking any medications, supplements, or herbal remedies?", "Do you use tobacco, vaping products, or recreational drugs?", "How many alcoholic drinks do you consume per week?", "Are you current on recommended immunizations (flu, COVID, others)?", "Do you have any health goals or concerns you would like to discuss today?", lastQ],
    specialties: ["general-practice"],
  },
  {
    id: "annual-physical", condition: "Annual Wellness Exam", category: "General Medicine", severity: "low",
    description: "Comprehensive annual preventive visit per USPSTF guidelines. Includes biometric screening, risk stratification, age-appropriate cancer screening, immunization updates, and motivational interviewing for lifestyle modification.",
    questions: ["When was your last full physical examination and what were the key findings?", "Are you experiencing any new symptoms, pain, or changes in your health since your last annual?", "Do you have a family history of heart disease, diabetes, cancer, or other chronic conditions?", "Are you current on all age-appropriate cancer screenings (mammogram, colonoscopy, Pap smear, PSA)?", "How is your diet — would you describe it as balanced with fruits, vegetables, and whole grains?", "Are you exercising regularly — at least 150 minutes of moderate aerobic activity per week?", "What is your current stress level and how are you managing it?", "Are you up to date on vaccinations including flu, COVID boosters, shingles, and pneumonia?", "Have you had any recent changes in vision, hearing, or dental health?", "Do you have any mental health concerns — anxiety, depression, or sleep difficulties?", lastQ],
    specialties: ["general-practice"],
  },
  {
    id: "urgent-care", condition: "Urgent Care Visit", category: "General Medicine", severity: "moderate",
    description: "Acute symptom evaluation for non-life-threatening conditions requiring same-day assessment. Triage focuses on symptom onset, severity, red flags, and determination of appropriate care level.",
    questions: ["What is your main concern and when did the symptoms start?", "On a scale of 1 to 10, how severe are your symptoms right now?", "Have you had a fever — if so, what was the highest temperature?", "Are you experiencing any nausea, vomiting, or diarrhea?", "Have you taken any medications for this issue — what and how much?", "Are you having any difficulty breathing, chest pain, or severe headache?", "Have you been exposed to anyone who is sick or traveled recently?", "Are you able to keep fluids down without vomiting?", "Do you have any allergies to medications?", "Is there anything that makes your symptoms better or worse?", lastQ],
    specialties: ["general-practice"],
  },
  {
    id: "chronic-pain", condition: "Chronic Pain Management", category: "General Medicine", severity: "moderate",
    description: "Multimodal chronic pain assessment per CDC guidelines. Covers pain characterization, functional impact, opioid stewardship, non-pharmacologic approaches, and risk assessment for substance use disorders.",
    questions: ["Where is your pain located and how would you describe it — sharp, dull, burning, aching?", "On a scale of 0 to 10, what is your average pain level over the past week?", "How long have you been experiencing this pain and has it changed over time?", "What activities does your pain prevent or limit — work, sleep, exercise, daily tasks?", "Are you currently taking any pain medications — prescription, over-the-counter, or supplements?", "If taking opioids, how many pills per day are you using and has your dose changed?", "Have you tried non-drug approaches — physical therapy, acupuncture, cognitive behavioral therapy?", "Are you experiencing any depression, anxiety, or difficulty coping with your pain?", "Do you have a history of substance use disorder or are you currently in recovery?", "Have you had any recent imaging or procedures related to your pain?", lastQ],
    specialties: ["general-practice", "therapy", "rheumatology"],
  },
  {
    id: "insomnia", condition: "Sleep Disorders / Insomnia", category: "General Medicine", severity: "moderate",
    description: "Sleep disturbance evaluation per AASM guidelines. Covers insomnia severity, circadian rhythm, sleep hygiene, comorbid conditions, and screening for obstructive sleep apnea and restless legs.",
    questions: ["How long does it take you to fall asleep on average — less than 15 minutes, 15-30, or more than 30?", "Do you wake up during the night — if so, how many times and can you fall back asleep?", "How many hours of actual sleep do you get per night compared to time in bed?", "Do you feel rested when you wake up, or do you feel tired during the day?", "Do you snore loudly, gasp for air, or have witnessed breathing pauses during sleep?", "Are you experiencing restless legs — an irresistible urge to move your legs at night?", "What is your caffeine intake and when do you consume your last caffeinated drink?", "Are you taking any sleep medications — prescription, over-the-counter, or melatonin?", "Do you have a consistent sleep schedule including weekends?", "Are you experiencing mood changes, anxiety, or depression alongside your sleep issues?", lastQ],
    specialties: ["general-practice", "psychiatry", "neurology"],
  },
  {
    id: "weight-management", condition: "Weight Management / Obesity", category: "General Medicine", severity: "moderate",
    description: "Obesity assessment per AHA/ACC/TOS guidelines. Covers BMI classification, comorbidity screening, dietary assessment, physical activity, behavioral counseling, and pharmacotherapy or bariatric surgery eligibility.",
    questions: ["What is your current height and weight — and what was your weight one year ago?", "How would you describe your typical daily diet — number of meals, portions, snacking?", "How many minutes of physical activity do you get per week?", "Have you tried any weight loss programs or diets in the past — what were the results?", "Do you have any obesity-related conditions — diabetes, hypertension, sleep apnea, joint pain?", "Are you experiencing emotional eating, binge eating, or difficulty controlling food intake?", "How many sugary beverages, fast food meals, or alcohol do you consume per week?", "Are you taking any medications that may contribute to weight gain?", "What is your target weight and what motivated you to address your weight now?", "Do you have access to healthy food options and a safe environment for exercise?", lastQ],
    specialties: ["general-practice", "endocrinology"],
  },

  // ── Cardiology ────────────────────────────────────────────────────
  {
    id: "hypertension", condition: "Hypertension", category: "Cardiology", severity: "high",
    description: "Persistently elevated blood pressure ≥130/80 mmHg per 2025 AHA/ACC guidelines. Assessment includes home BP monitoring, CV risk calculation (PREVENT equation), and target organ damage screening.",
    questions: ["What is your current blood pressure reading and when was it taken?", "Are you taking your blood pressure medication exactly as prescribed?", "Do you monitor your blood pressure at home? What have your recent readings been?", "Have you experienced any headaches, chest pain, or shortness of breath?", "Are you limiting your sodium intake and following a DASH-style diet?", "Have you noticed any swelling in your ankles or feet?", "How many times per week do you engage in aerobic exercise?", "Have you had any episodes of palpitations or irregular heartbeat?", "Are you consuming alcohol? How many drinks per week?", "Have you had recent lab work including kidney function and cholesterol?", lastQ],
    specialties: ["cardiology"],
  },
  {
    id: "heart-disease", condition: "Heart Disease", category: "Cardiology", severity: "critical",
    description: "Coronary artery disease, heart failure, or valvular disease. Assessment focuses on symptom burden (chest pain, dyspnea, edema), medication adherence, and functional status using NYHA classification.",
    questions: ["Are you experiencing any chest pain, pressure, or discomfort right now?", "Do you feel short of breath at rest or with minimal activity?", "Are you taking all your heart medications (antiplatelets, beta-blockers, statins) as prescribed?", "Have you noticed any irregular heartbeat, fluttering, or skipped beats?", "How many blocks can you walk before needing to stop?", "Have you had any episodes of dizziness, lightheadedness, or fainting?", "Are you monitoring your weight daily? Has it increased suddenly?", "Have you noticed new or worsening swelling in your legs or abdomen?", "Are you following a low-sodium, heart-healthy diet?", "Do you have a follow-up appointment scheduled with your cardiologist?", lastQ],
    specialties: ["cardiology"],
  },
  {
    id: "heart-failure", condition: "Heart Failure (CHF)", category: "Cardiology", severity: "critical",
    description: "Chronic heart failure management per 2022 AHA/ACC/HFSA guidelines. Covers NYHA functional classification, volume status assessment, GDMT titration, daily weight monitoring, and exacerbation prevention.",
    questions: ["Are you weighing yourself every morning — have you gained more than 2 pounds in a day or 5 in a week?", "How many pillows do you use to sleep comfortably — have you needed to add more recently?", "Are you able to walk across a flat room without stopping for breath?", "Are you taking all your heart failure medications — including the four pillars of GDMT?", "Have you noticed increased swelling in your ankles, legs, or abdomen?", "Are you limiting your fluid intake to the recommended amount per day?", "How many times have you been admitted to the hospital for heart failure in the past year?", "Are you following a strict low-sodium diet — less than 2000 mg per day?", "Have you experienced any dizziness, lightheadedness, or near-fainting episodes?", "Do you have a heart failure action plan and know when to call your doctor?", lastQ],
    specialties: ["cardiology"],
  },
  {
    id: "atrial-fibrillation", condition: "Atrial Fibrillation", category: "Cardiology", severity: "high",
    description: "Atrial fibrillation management per 2023 ACC/AHA/ACCP/HRS guidelines. Covers stroke risk (CHA₂DS₂-VASc), anticoagulation, rate vs rhythm control, and symptom assessment using EHRA score.",
    questions: ["Are you aware of your heart rhythm — do you feel palpitations, fluttering, or irregular beats?", "Are you taking your anticoagulation medication (blood thinner) every day without missed doses?", "What is your current heart rate control strategy — rate control or rhythm control?", "Have you experienced any dizziness, lightheadedness, or near-fainting episodes?", "Have you had any symptoms of stroke — facial drooping, arm weakness, speech difficulty?", "Are you monitoring your pulse at home — is it consistently above or below target?", "Do you have a history of stroke, TIA, or blood clot?", "Are you avoiding excessive alcohol, caffeine, and other AFib triggers?", "Have you had any bleeding events — nosebleeds, bruising, blood in urine or stool?", "Do you have a follow-up with your electrophysiologist and are your INR levels monitored?", lastQ],
    specialties: ["cardiology"],
  },
  {
    id: "coronary-artery-disease", condition: "Coronary Artery Disease / Angina", category: "Cardiology", severity: "high",
    description: "Atherosclerotic coronary artery disease with angina pectoris. Assessment includes symptom characterization (stable vs unstable), risk factor modification, antiplatelet therapy, and functional capacity.",
    questions: ["How would you describe your chest pain — location, quality, duration, and what triggers it?", "Does your chest pain occur with exertion, at rest, or both?", "How many blocks can you walk or flights of stairs before chest pain begins?", "Are you taking aspirin or other antiplatelet medication as prescribed?", "Have you had a stress test, cardiac catheterization, or coronary stent placed?", "Are you managing your cholesterol with a statin — what is your LDL goal?", "Have you quit smoking completely — do you need help with cessation?", "Are you following a heart-healthy diet and exercising regularly?", "Have you experienced any worsening angina, new symptoms, or chest pain at rest?", "Do you carry nitroglycerin — how often have you used it in the past month?", lastQ],
    specialties: ["cardiology"],
  },
  {
    id: "peripheral-artery-disease", condition: "Peripheral Artery Disease", category: "Cardiology", severity: "moderate",
    description: "Peripheral arterial disease from atherosclerosis causing limb ischemia. AHA guidelines emphasize walking distance assessment, ABI monitoring, cardiovascular risk reduction, and wound care for critical limb ischemia.",
    questions: ["How far can you walk before experiencing leg pain or cramping — Claudication distance?", "Do you experience leg pain at rest, especially when lying down or at night?", "Have you noticed any sores or wounds on your feet or legs that are not healing?", "Are you able to feel pulses in your feet — has anyone checked your ABI?", "Are you taking all cardiovascular medications — statin, antiplatelet, blood pressure?", "Have you quit smoking completely — this is the most important step for PAD?", "Are you following a supervised exercise program to improve your walking distance?", "Have you noticed any color changes — pallor, cyanosis — in your legs or feet?", "Do you elevate your legs — do your feet turn red when dangled (dependent rubor)?", "Are you wearing properly fitting shoes and inspecting your feet daily for injury?", lastQ],
    specialties: ["cardiology"],
  },
  {
    id: "valvular-heart-disease", condition: "Valvular Heart Disease", category: "Cardiology", severity: "high",
    description: "Non-rheumatic valvular heart disease including aortic stenosis, mitral regurgitation, and mitral prolapse. ACC/AHA guidelines emphasize severity grading, symptom monitoring, and timing of surgical intervention.",
    questions: ["Which heart valve is affected and what is the severity — mild, moderate, or severe?", "Are you experiencing shortness of breath, especially with activity or when lying flat?", "Have you had any episodes of chest pain, dizziness, or fainting?", "Do you notice palpitations, a racing heart, or irregular heartbeat?", "Are you taking your prescribed medications — diuretics, anticoagulants, ACE inhibitors?", "How has your exercise tolerance changed — can you perform the same activities as before?", "Have you noticed any new or worsening leg swelling or weight gain?", "When was your last echocardiogram and what did it show about valve function?", "Do you have a surgical or interventional cardiology follow-up scheduled?", "Are you experiencing fatigue, weakness, or difficulty performing daily activities?", lastQ],
    specialties: ["cardiology"],
  },
  {
    id: "post-cardiac-event", condition: "Post-MI / Post-PCI Recovery", category: "Cardiology", severity: "high",
    description: "Recovery following myocardial infarction or percutaneous coronary intervention. Covers cardiac rehabilitation, medication optimization (DAPT), wound care, return to activities, and psychosocial recovery.",
    questions: ["How many days or weeks has it been since your heart attack or stent procedure?", "Are you attending cardiac rehabilitation sessions as prescribed?", "Are you taking all your medications — dual antiplatelet therapy, statin, beta-blocker, ACE inhibitor?", "Have you had any recurrence of chest pain, shortness of breath, or palpitations?", "Is the catheterization site (groin or wrist) healing properly — any bruising, swelling, or bleeding?", "Have you returned to work or driving — are you following the recommended restrictions?", "How has your mood been — are you experiencing anxiety, depression, or fear about your heart?", "Are you following the recommended diet — low sodium, heart-healthy fats, limited processed foods?", "Do you have a follow-up appointment with your cardiologist and when is your stress test?", "Are you avoiding tobacco completely and limiting alcohol consumption?", lastQ],
    specialties: ["cardiology"],
  },

  // ── Pediatrics ────────────────────────────────────────────────────
  {
    id: "pediatric", condition: "Pediatric Checkup", category: "Pediatrics", severity: "moderate",
    description: "Well-child visit per AAP Bright Futures guidelines. Includes developmental screening, vaccination review, growth monitoring, and anticipatory guidance for age-appropriate milestones.",
    questions: ["What is your child's current weight, height, and temperature if measured?", "Has your child been eating and drinking normally for their age?", "Is your child meeting their developmental milestones (smiling, sitting, walking, talking)?", "Has your child been sleeping well and on a regular schedule?", "Has your child had any vomiting, diarrhea, or fever recently?", "Is your child up to date on all recommended vaccinations?", "Have you noticed any rash, skin changes, or signs of allergic reaction?", "Has your child achieved age-appropriate bladder/bowel control?", "Are there any behavioral concerns — tantrums, withdrawal, aggression?", "Has your child been around anyone who was sick or had a contagious illness?", lastQ],
    specialties: ["pediatrics"],
  },
  {
    id: "child-asthma", condition: "Pediatric Asthma", category: "Pediatrics", severity: "moderate",
    description: "Pediatric asthma management per GINA and NAEPP guidelines. Covers trigger identification, inhaler technique, asthma action plan adherence, exacerbation prevention, and activity limitation.",
    questions: ["How many times has your child used their rescue inhaler in the past week?", "Does your child wake up at night due to coughing or wheezing?", "Can your child participate in physical activities and sports without breathing problems?", "Are you using the spacer device correctly with your child's inhaler?", "Have you identified and minimized your child's asthma triggers (dust, pets, smoke)?", "Does your child have a written asthma action plan from their doctor?", "Has your child had any ER visits or hospitalizations for asthma in the past year?", "Are you administering the daily controller medication as prescribed?", "Does your child's asthma interfere with school attendance or activities?", "Have you checked your child's peak flow readings if they use a peak flow meter?", lastQ],
    specialties: ["pediatrics", "pulmonology"],
  },
  {
    id: "child-adhd", condition: "ADHD Assessment", category: "Pediatrics", severity: "moderate",
    description: "Attention-deficit/hyperactivity disorder evaluation per AAP guidelines. Covers symptom assessment across settings (home, school), behavioral rating scales, medication effects, and comorbidity screening.",
    questions: ["How would you describe your child's ability to focus on tasks — does it vary by interest level?", "Does your child have difficulty sitting still, staying quiet, or waiting their turn?", "Has your child's teacher reported problems with attention, impulse control, or following instructions?", "How is your child's academic performance compared to their ability?", "Is your child taking ADHD medication — if so, how is it affecting their symptoms and appetite?", "Does your child have trouble organizing tasks, completing homework, or remembering assignments?", "Are there any sleep problems — difficulty falling asleep, restlessness, or daytime sleepiness?", "Does your child have difficulty making or keeping friends?", "Have you noticed any emotional outbursts, irritability, or mood swings?", "Has your child been evaluated for any co-existing conditions — anxiety, learning disabilities, oppositional behavior?", lastQ],
    specialties: ["pediatrics", "psychiatry"],
  },
  {
    id: "child-development", condition: "Developmental Milestones", category: "Pediatrics", severity: "low",
    description: "Developmental screening per AAP Bright Futures schedules. Covers motor, language, social-emotional, and cognitive milestones using validated tools (ASQ, M-CHAT) with red flag identification.",
    questions: ["What age is your child and are they meeting expected milestones for their age group?", "Can your child hold their head up, sit without support, crawl, stand, or walk independently?", "How many words or phrases does your child use — are they combining words?", "Does your child make eye contact, respond to their name, and point to objects of interest?", "Does your child engage in pretend play, imitate actions, or show interest in other children?", "Are there any concerns about hearing or vision — does your child respond to sounds and follow objects?", "Has your child lost any skills they previously had — regression is a red flag?", "Does your child have any repetitive behaviors or restricted interests?", "Are you reading, singing, and talking to your child daily to support language development?", "Would you like information about early intervention services or developmental resources?", lastQ],
    specialties: ["pediatrics"],
  },
  {
    id: "child-anxiety", condition: "Childhood Anxiety / Behavioral", category: "Pediatrics", severity: "moderate",
    description: "Childhood anxiety and behavioral disorders assessed per AAP guidelines. Covers separation anxiety, social anxiety, generalized anxiety, school avoidance, and comorbid ADHD or mood disorders.",
    questions: ["Does your child complain of stomachaches, headaches, or other physical symptoms without a medical cause?", "Does your child resist going to school, have frequent absences, or refuse to separate from you?", "Is your child excessively worried about everyday things — health, safety, family, school?", "Does your child avoid social situations, have trouble making friends, or rarely participate in activities?", "How are your child's temper tantrums — frequency, duration, intensity, and triggers?", "Does your child have difficulty sleeping alone, experience nightmares, or have bedtime resistance?", "Has your child's behavior changed recently — at home, school, or with friends?", "Are you using any behavioral strategies or discipline approaches at home?", "Would your child benefit from counseling, therapy, or a mental health evaluation?", "Do you have any family history of anxiety, depression, or other mental health conditions?", lastQ],
    specialties: ["pediatrics", "psychiatry"],
  },

  // ── Neurology ─────────────────────────────────────────────────────
  {
    id: "neurological", condition: "Neurological Disorders", category: "Neurology", severity: "high",
    description: "Neurologic conditions including headache/migraine, seizure disorders, neuropathy, and movement disorders. AAN guidelines emphasize symptom duration pattern, focal deficits, and functional impact.",
    questions: ["Have you had any new or worsening headaches, migraines, or head pain?", "Are you experiencing any dizziness, vertigo, or balance problems when walking?", "Have you had any seizures, tremors, or unusual involuntary movements?", "Are you taking your neurological medications as prescribed — including antiseizure or migraine prophylaxis?", "Have you noticed any changes in your vision — blurring, double vision, or vision loss?", "Are you experiencing any numbness, tingling, or weakness anywhere in your body?", "Have you had any difficulty speaking, swallowing, or understanding others?", "Are you having trouble with memory, concentration, or finding words?", "Have you had any falls or near-falls in the past week?", "Are you able to walk without assistance and perform your daily activities?", lastQ],
    specialties: ["neurology"],
  },
  {
    id: "migraine", condition: "Migraine / Chronic Headache", category: "Neurology", severity: "moderate",
    description: "Migraine disorder per AHS guidelines. Covers frequency, triggers, acute and preventive medication efficacy, disability impact, and lifestyle modification. Chronic migraine defined as ≥15 headache days per month.",
    questions: ["How many migraine days per month are you experiencing — is it increasing or stable?", "Can you identify triggers for your migraines — stress, hormones, foods, sleep changes?", "How would you rate your typical migraine pain on a scale of 1 to 10?", "Do your migraines include aura — visual changes, numbness, or speech difficulty?", "Are you taking acute medications — triptans, gepants, ditans — and how effective are they?", "Are you on a preventive medication — beta-blocker, anticonvulsant, CGRP monoclonal antibody?", "How many days per month does your migraine prevent you from working or performing daily activities?", "Are you overusing acute pain medication — more than 10-15 days per month?", "Have you tried lifestyle modifications — regular sleep, hydration, stress management?", "Have you had any new or unusual headache features — worst ever, sudden onset, neurological deficits?", lastQ],
    specialties: ["neurology"],
  },
  {
    id: "epilepsy", condition: "Epilepsy / Seizure Disorder", category: "Neurology", severity: "high",
    description: "Epilepsy management per AAN/AES guidelines. Covers seizure type and frequency, medication compliance, trigger avoidance, driving restrictions, SUDEP risk, and drug level monitoring.",
    questions: ["When was your last seizure — what type was it and how long did it last?", "Are you taking your antiseizure medication every day at the same time without missed doses?", "Have you had any breakthrough seizures since your last visit — what were the circumstances?", "Do you have any known seizure triggers — missed sleep, alcohol, stress, flashing lights?", "Are you experiencing any medication side effects — drowsiness, dizziness, cognitive dulling?", "Are you following driving restrictions as required by your state's laws?", "Have you had any injuries during seizures — tongue biting, falls, burns?", "Are you taking your medication at consistent levels — have you had drug levels checked?", "Do you have a seizure action plan and does your family know what to do during a seizure?", "Have you discussed SUDEP risk and seizure first aid with your healthcare team?", lastQ],
    specialties: ["neurology"],
  },
  {
    id: "stroke-recovery", condition: "Stroke Follow-up", category: "Neurology", severity: "critical",
    description: "Post-stroke recovery and secondary prevention per AHA/ASA guidelines. Covers deficit assessment, rehabilitation progress, medication compliance (antiplatelet/anticoagulant), and mood screening (post-stroke depression).",
    questions: ["How long ago did your stroke occur and what deficits are you still experiencing?", "Are you able to speak clearly and understand conversations without difficulty?", "Can you use your affected arm and hand for daily tasks — eating, dressing, writing?", "Are you walking safely — do you need an assistive device (cane, walker)?", "Are you taking your stroke prevention medications — aspirin, clopidogrel, or anticoagulant?", "Have you attended speech, physical, or occupational therapy — how is your progress?", "Are you experiencing any new weakness, numbness, vision changes, or difficulty speaking?", "How has your mood been — post-stroke depression is very common and treatable?", "Are you managing your stroke risk factors — blood pressure, diabetes, cholesterol, smoking?", "Do you have a follow-up with your neurologist and are you keeping your rehabilitation appointments?", lastQ],
    specialties: ["neurology"],
  },
  {
    id: "parkinsons", condition: "Parkinson's Disease", category: "Neurology", severity: "high",
    description: "Parkinson's disease management per AAN/MDS guidelines. Covers motor symptoms (tremor, rigidity, bradykinesia), medication timing and wearing-off, dyskinesia, falls, and Hoehn-Yahr staging.",
    questions: ["Are your Parkinson's medications working well throughout the day or do you notice wearing-off?", "Do you experience involuntary movements (dyskinesia) when your medication is at peak effect?", "How is your walking — do you shuffle, freeze, or have difficulty starting movement?", "Have you had any falls or near-falls in the past month?", "How is your balance and posture — do you stoop or lean when walking?", "Are you experiencing tremor at rest — is it affecting your daily activities?", "Do you have any difficulty with swallowing, speaking softly, or writing smaller (micrographia)?", "Are you taking your carbidopa-levodopa and other Parkinson's medications on schedule?", "Do you experience non-motor symptoms — constipation, sleep disturbance, depression, or cognition changes?", "Are you exercising regularly — boxing, cycling, or PD-specific exercise programs can help?", lastQ],
    specialties: ["neurology"],
  },
  {
    id: "multiple-sclerosis", condition: "Multiple Sclerosis", category: "Neurology", severity: "high",
    description: "Multiple sclerosis management per AAN guidelines. Covers relapse history, DMT compliance, disability progression (EDSS), symptom management (fatigue, spasticity, cognition), and MRI surveillance.",
    questions: ["When was your last MS relapse and what symptoms did you experience?", "Are you taking your disease-modifying therapy (DMT) as prescribed — any missed doses?", "Have you noticed any new or worsening numbness, tingling, or weakness?", "Are you experiencing fatigue — the most common MS symptom — and how does it affect your day?", "Do you have any problems with balance, walking, or coordination?", "Have you noticed any changes in your vision — optic neuritis, double vision?", "Are you experiencing any bladder or bowel dysfunction?", "How is your cognitive function — memory, concentration, information processing?", "When was your last brain and spine MRI and were there any new lesions?", "Are you managing heat sensitivity and following an MS-friendly exercise program?", lastQ],
    specialties: ["neurology"],
  },
  {
    id: "peripheral-neuropathy", condition: "Peripheral Neuropathy", category: "Neurology", severity: "moderate",
    description: "Peripheral neuropathy assessment per AAN guidelines. Covers etiology (diabetes, autoimmune, idiopathic), distribution, pain severity, functional impact, and treatment response to neuropathic agents.",
    questions: ["Where exactly do you feel numbness, tingling, or burning — feet, hands, or both?", "When did your symptoms begin and are they getting progressively worse?", "Do you have diabetes — what is your most recent HbA1c level?", "How would you rate your neuropathic pain on a scale of 0 to 10?", "Are you taking any neuropathic pain medications — gabapentin, pregabalin, duloxetine?", "Are your symptoms worse at night and do they interfere with your sleep?", "Have you had nerve conduction studies or other tests to determine the cause?", "Do you have any weakness in your feet or hands — difficulty with buttons, walking, or climbing stairs?", "Are you at risk for falls due to numbness or balance problems?", "Have you checked your feet for injuries — do you inspect them daily?", lastQ],
    specialties: ["neurology", "endocrinology"],
  },

  // ── Psychiatry ────────────────────────────────────────────────────
  {
    id: "depression-anxiety", condition: "Depression & Anxiety", category: "Psychiatry / Behavioral Health", severity: "high",
    description: "Depression (PHQ-9) and generalized anxiety (GAD-7) are common mental health disorders. Screening covers mood, anhedonia, sleep, energy, concentration, and safety. Suicidal ideation requires immediate assessment.",
    questions: ["Over the past two weeks, how often have you felt down, depressed, or hopeless?", "Have you lost interest or pleasure in doing things you usually enjoy?", "Are you taking your antidepressant or anti-anxiety medication as prescribed?", "Are you attending therapy or counseling sessions regularly?", "How has your sleep been — trouble falling asleep, staying asleep, or sleeping too much?", "Have you had thoughts of harming yourself or that life isn't worth living?", "Have you been feeling anxious, nervous, or on edge most days?", "Are you worrying excessively about things that are out of your control?", "How is your appetite and energy level compared to usual?", "Are you avoiding social situations or having difficulty concentrating?", lastQ],
    specialties: ["psychiatry"],
  },
  {
    id: "bipolar", condition: "Bipolar Disorder", category: "Psychiatry / Behavioral Health", severity: "high",
    description: "Bipolar disorder management per APA guidelines. Covers mood episode detection (mania, hypomania, depression), lithium monitoring, antipsychotic side effects, and safety planning for impulsivity and suicidality.",
    questions: ["Have you experienced any manic episodes — elevated mood, decreased sleep need, racing thoughts?", "Are you taking your mood stabilizer (lithium, valproate) or antipsychotic as prescribed?", "If on lithium, when was your last lithium level and was it within therapeutic range?", "Are you experiencing any depressive episodes — sadness, fatigue, hopelessness?", "Have you had any impulsive behaviors — excessive spending, risky sexual behavior, substance use?", "How many mood episodes have you had in the past year?", "Are you experiencing any medication side effects — weight gain, tremor, thyroid changes?", "Do you have a safety plan for crisis situations and does your support system know the warning signs?", "How is your sleep — changes in sleep patterns often precede mood episodes?", "Have you had any thoughts of self-harm or suicide during either manic or depressive states?", lastQ],
    specialties: ["psychiatry"],
  },
  {
    id: "ptsd", condition: "PTSD / Trauma Recovery", category: "Psychiatry / Behavioral Health", severity: "high",
    description: "Post-traumatic stress disorder per APA/VA/DoD guidelines. Covers trauma type, re-experiencing symptoms, avoidance, hyperarousal, dissociation, and evidence-based treatment (PE, CPT, EMDR).",
    questions: ["Have you experienced or witnessed a traumatic event that continues to affect you?", "Do you have intrusive memories, flashbacks, or nightmares related to the trauma?", "Do you avoid people, places, or situations that remind you of the trauma?", "Are you on edge, easily startled, or having difficulty sleeping since the trauma?", "Do you feel emotionally numb, detached from others, or have difficulty experiencing positive emotions?", "Are you experiencing anger, irritability, or difficulty concentrating?", "Are you having thoughts of self-harm or feeling that life is not worth living?", "Are you in trauma-focused therapy — such as prolonged exposure, CPT, or EMDR?", "Are you taking any medications for PTSD — SSRIs, prazosin for nightmares?", "Do you have a support system and do they understand your condition?", lastQ],
    specialties: ["psychiatry"],
  },
  {
    id: "schizophrenia", condition: "Schizophrenia / Psychosis", category: "Psychiatry / Behavioral Health", severity: "critical",
    description: "Schizophrenia spectrum disorders per APA guidelines. Covers positive symptoms (hallucinations, delusions), negative symptoms, cognitive deficits, medication adherence, EPS monitoring, and functional recovery.",
    questions: ["Are you experiencing any hallucinations — hearing voices, seeing things others don't?", "Do you have any beliefs that others find unusual or that cause distress?", "Are you taking your antipsychotic medication every day as prescribed?", "Are you experiencing any side effects from your medication — stiffness, tremor, restlessness, weight gain?", "How is your motivation and ability to engage in daily activities?", "Are you able to care for yourself — hygiene, eating, managing your living space?", "Do you have any difficulty with concentration, memory, or thinking clearly?", "Are you sleeping well and maintaining a regular daily routine?", "Do you have people you trust who can help you if you feel your symptoms worsening?", "Are you aware that you have a mental health condition and do you agree with your treatment plan?", lastQ],
    specialties: ["psychiatry"],
  },
  {
    id: "ocd", condition: "OCD / Related Disorders", category: "Psychiatry / Behavioral Health", severity: "moderate",
    description: "Obsessive-compulsive disorder per APA guidelines. Covers obsession and compulsion types, Y-BOCS severity score, response to ERP therapy and SSRIs, and impact on daily functioning.",
    questions: ["What obsessive thoughts bother you most — contamination, harm, symmetry, forbidden thoughts?", "What compulsive behaviors do you perform — washing, checking, counting, ordering, mental rituals?", "How many hours per day do obsessions and compulsions occupy — is it interfering with activities?", "Are you taking an SSRI medication at an adequate dose for OCD?", "Have you tried Exposure and Response Prevention (ERP) therapy — the gold standard treatment?", "Are you avoiding certain situations, objects, or places because of your obsessions?", "How distressed are you by your intrusive thoughts on a scale of 0 to 10?", "Do you recognize that your obsessions or compulsions are excessive or irrational?", "How is your OCD affecting your work, relationships, or daily routines?", "Have you experienced any improvement since starting treatment — even partial improvement?", lastQ],
    specialties: ["psychiatry"],
  },
  {
    id: "substance-use", condition: "Substance Use / Addiction", category: "Psychiatry / Behavioral Health", severity: "high",
    description: "Substance use disorder assessment per ASAM guidelines. Covers substance type, frequency, withdrawal risk, prior treatment attempts, overdose history, and medication-assisted treatment (MAT) eligibility.",
    questions: ["What substance are you using — alcohol, opioids, stimulants, benzodiazepines, cannabis, or other?", "How frequently and how much are you using each substance?", "Have you experienced withdrawal symptoms — tremors, sweating, nausea, seizures?", "Have you tried to stop or reduce your use before — what happened?", "Have you ever experienced an overdose or required emergency treatment?", "Are you interested in medication-assisted treatment — buprenorphine, naltrexone, methadone?", "How is your substance use affecting your health, relationships, work, or legal situation?", "Are you experiencing any co-occurring mental health conditions — depression, anxiety, trauma?", "Do you have a safe living environment and support system for recovery?", "Are you willing to participate in ongoing treatment including counseling and support groups?", lastQ],
    specialties: ["psychiatry", "general-practice"],
  },
  {
    id: "eating-disorders", condition: "Eating Disorders", category: "Psychiatry / Behavioral Health", severity: "critical",
    description: "Eating disorder assessment per APA/ADA guidelines. Covers restrict, binge, and purge behaviors, BMI and vital sign monitoring, electrolyte abnormalities, and medical stability for treatment eligibility.",
    questions: ["What is your current height, weight, and have you noticed any recent weight changes?", "Are you restricting your food intake — skipping meals, counting calories, avoiding food groups?", "Do you experience episodes of binge eating — eating large amounts feeling out of control?", "Are you engaging in purging behaviors — self-induced vomiting, laxatives, diuretics, excessive exercise?", "Do you have concerns about your body image or feel terrified of gaining weight?", "Have you noticed any physical symptoms — dizziness, hair loss, dry skin, muscle cramps?", "Are your menstrual periods regular — or have they stopped?", "Have you had any electrolyte abnormalities, heart rhythm problems, or dental erosion?", "Are you in treatment with a therapist who specializes in eating disorders?", "Do you have a medical team monitoring your weight, labs, and vital signs regularly?", lastQ],
    specialties: ["psychiatry", "pediatrics", "gastroenterology"],
  },

  // ── Dermatology ───────────────────────────────────────────────────
  {
    id: "eczema", condition: "Eczema / Atopic Dermatitis", category: "Dermatology", severity: "moderate",
    description: "Atopic dermatitis management per AAD/NAC guidelines. Covers SCORAD severity assessment, trigger identification, topical therapy (steroid-sparing agents), skin barrier repair, and infection prevention.",
    questions: ["How would you rate the severity of your eczema on a scale of 1 to 10 right now?", "Where on your body are the eczema patches located — has the distribution changed?", "Are you using your topical corticosteroid or calcineurin inhibitor as prescribed?", "What triggers your flares — stress, sweat, soaps, fabrics, food, weather changes?", "Are you moisturizing daily with a fragrance-free emollient — which product do you use?", "Have you noticed any signs of skin infection — increased redness, warmth, pus, or fever?", "How has your eczema affected your sleep — do you wake up scratching?", "Are you experiencing any emotional distress, embarrassment, or social avoidance due to your skin?", "Have you tried wet wrap therapy or bleach baths for severe flares?", "Do you have a follow-up with your dermatologist and are you aware of newer biologic treatments?", lastQ],
    specialties: ["dermatology"],
  },
  {
    id: "psoriasis", condition: "Psoriasis", category: "Dermatology", severity: "moderate",
    description: "Psoriasis management per AAD-NPF guidelines. Covers BSA/PASI assessment, plaque characteristics, topical vs systemic therapy, biologic monitoring, psoriatic arthritis screening, and comorbidity management.",
    questions: ["What percentage of your body surface area (BSA) is currently affected by psoriasis?", "Are your plaques scaling, red, itchy, painful, or cracked and bleeding?", "Are you using topical treatments — corticosteroids, vitamin D analogues, or calcineurin inhibitors?", "Are you on systemic therapy — methotrexate, cyclosporine, or a biologic agent?", "If on a biologic, are you experiencing any injection site reactions or infections?", "Have you noticed any joint pain, stiffness, or swelling — indicating psoriatic arthritis?", "How is psoriasis affecting your quality of life, self-esteem, and social activities?", "Are you managing cardiovascular risk factors — psoriasis is associated with heart disease?", "Have you tried phototherapy and what was your response?", "Are you aware ofPsoriasis Area and Severity Index (PASI) and your current score?", lastQ],
    specialties: ["dermatology", "rheumatology"],
  },
  {
    id: "acne-rosacea", condition: "Acne & Rosacea", category: "Dermatology", severity: "low",
    description: "Acne vulgaris and rosacea evaluation per AAD guidelines. Covers lesion type (comedones, papules, pustules), severity grading, treatment response, scarring assessment, and skincare regimen optimization.",
    questions: ["What type of acne lesions do you have — blackheads, whiteheads, papules, pustules, or cysts?", "Where on your face or body is your acne concentrated?", "Are you currently using any topical treatments — retinoid, benzoyl peroxide, antibiotic?", "Are you taking oral antibiotics or isotretinoin (Accutane) for your acne?", "How has your skin responded to treatment — any improvement in breakouts or scarring?", "If you have rosacea, do you experience facial flushing, redness, bumps, or eye symptoms?", "What are your skincare products — cleanser, moisturizer, sunscreen — and are they non-comedogenic?", "Are you experiencing any emotional impact — social avoidance, low self-esteem, or anxiety?", "Are you avoiding any foods, beverages, or environmental triggers that worsen your condition?", "Do you have a follow-up with your dermatologist to monitor treatment progress?", lastQ],
    specialties: ["dermatology"],
  },
  {
    id: "skin-cancer-screening", condition: "Skin Cancer Screening / Mole Check", category: "Dermatology", severity: "high",
    description: "Skin cancer screening per USPSTF and AAD guidelines. Covers ABCDE criteria for melanoma, atypical mole assessment, biopsy history, sun exposure history, and family history of melanoma.",
    questions: ["Do you have a new mole or spot that has changed in size, shape, color, or texture?", "Are you experiencing any itching, bleeding, or crusting on a mole or skin lesion?", "Have you noticed any asymmetry, irregular borders, multiple colors, or diameter >6mm in any spot?", "How many blistering sunburns have you had in your lifetime, especially before age 18?", "Do you use sunscreen daily — what SPF and how often do you reapply?", "Do you have a family history of melanoma or other skin cancers?", "How many moles do you have total, and do you have any atypical or dysplastic moles?", "Have you had any previous skin biopsies — were any results abnormal?", "Do you avoid tanning beds and practice sun-protective behaviors?", "When was your last full-body skin examination by a dermatologist?", lastQ],
    specialties: ["dermatology"],
  },
  {
    id: "contact-dermatitis", condition: "Contact Dermatitis", category: "Dermatology", severity: "low",
    description: "Allergic or irritant contact dermatitis evaluation. Covers allergen identification, patch testing, rash distribution pattern, occupational exposure, and avoidance strategies.",
    questions: ["Where on your body is the rash located and what does it look like — red, blistering, scaly?", "When did the rash start and is it getting better, worse, or staying the same?", "Have you been exposed to any new products — soaps, detergents, jewelry, plants, or cosmetics?", "Do you wear gloves at work or handle chemicals, solvents, or irritants regularly?", "Have you had patch testing to identify specific allergens?", "Are you using any topical treatments — hydrocortisone cream, antihistamines?", "Is the rash itchy, painful, or burning — and does it affect your sleep or daily activities?", "Have you removed the suspected trigger — are you seeing improvement?", "Do you have a history of eczema, asthma, or other allergic conditions?", "Would you like information about allergen avoidance and skin barrier protection?", lastQ],
    specialties: ["dermatology"],
  },
  {
    id: "fungal-infections", condition: "Fungal / Skin Infections", category: "Dermatology", severity: "low",
    description: "Dermatophyte, yeast, and bacterial skin infections. Covers tinea corporis/pedis, onychomycosis, candidiasis, and bacterial cellulitis. Assessment includes treatment response and recurrence prevention.",
    questions: ["Where on your body is the infection located — scalp, body, feet, nails, or groin?", "What does the rash or lesion look like — ring-shaped, scaly, red, pustular, or discolored nails?", "Have you been using any over-the-counter antifungal or prescription treatment?", "How long have you had the infection and is it responding to treatment?", "Do you have recurrent fungal infections — diabetes, immunosuppression, or moisture exposure?", "Are you keeping the affected area clean and dry?", "Have you been exposed to others with similar infections — athlete's foot, ringworm?", "If you have nail fungus, how thick, discolored, or painful are the affected nails?", "Are you treating your feet with antifungal powder and wearing breathable footwear?", "Do you need a prescription-strength antifungal or oral medication for resistant infection?", lastQ],
    specialties: ["dermatology"],
  },
  {
    id: "hair-loss", condition: "Alopecia / Hair Loss", category: "Dermatology", severity: "low",
    description: "Hair loss evaluation per AAD guidelines. Covers pattern recognition (androgenetic, alopecia areata, telogen effluvium), thyroid screening, nutritional deficiencies, and treatment options (minoxidil, finasteride, steroids).",
    questions: ["Where on your scalp is the hair loss most noticeable — receding hairline, crown, diffuse thinning?", "When did you first notice the hair loss and has it been gradually progressing or sudden?", "Are you experiencing any scalp symptoms — itching, scaling, pain, or inflammation?", "Have you had any recent illness, surgery, weight loss, or significant stress (telogen effluvium)?", "Are you taking any medications that can cause hair loss?", "Have you had your thyroid function and iron levels checked?", "Are you using any treatments — minoxidil, finasteride, steroid injections, or supplements?", "Do you have a family history of hair loss — androgenetic alopecia?", "How is the hair loss affecting your self-esteem and daily life?", "Would you like information about cosmetic options, wigs, or advanced treatments like PRP?", lastQ],
    specialties: ["dermatology"],
  },

  // ── Therapy ───────────────────────────────────────────────────────
  {
    id: "post-op-rehab", condition: "Post-Op Physical Rehabilitation", category: "Physical / Occupational / Speech Therapy", severity: "moderate",
    description: "Post-operative rehabilitation per ACS and APTA guidelines. Covers ROM assessment, pain with exercise, wound status, weight-bearing restrictions, functional goals, and progressive exercise program.",
    questions: ["What surgery did you have and how many weeks ago was the procedure?", "What is your current range of motion — can you measure the degrees of flexion and extension?", "How much pain do you experience during and after therapy exercises (0-10)?", "Are you following your weight-bearing restrictions — partial, full, or non-weight-bearing?", "Are you doing your home exercise program as prescribed between therapy sessions?", "What functional goals are you working toward — return to work, sport, or daily activities?", "Have you noticed improvement in strength, flexibility, or endurance since starting therapy?", "Are you using any assistive devices — crutches, brace, splint — as recommended?", "Do you have any concerns about your recovery progress compared to expected milestones?", "Are you keeping your follow-up appointments with your surgeon and physical therapist?", lastQ],
    specialties: ["therapy"],
  },
  {
    id: "stroke-rehab", condition: "Stroke Neuro-Rehabilitation", category: "Physical / Occupational / Speech Therapy", severity: "high",
    description: "Post-stroke neurological rehabilitation per AHA/ASA guidelines. Covers FIM scoring, motor recovery, speech/language therapy, cognitive rehabilitation, and adaptive equipment needs.",
    questions: ["How has your affected arm and leg function changed since rehabilitation began?", "Can you perform daily activities independently — feeding, dressing, grooming, bathing?", "Are you working with a speech therapist on any language or swallowing difficulties?", "How is your balance — can you stand and transfer safely without assistance?", "Are you experiencing any cognitive changes — memory, attention, problem-solving?", "What assistive devices are you using — wheelchair, walker, cane, adapted utensils?", "Are you practicing your exercises at home between therapy sessions?", "How has your mood been — depression is common after stroke and can affect recovery?", "Are you able to communicate effectively with family, friends, and healthcare providers?", "What are your most important functional goals for this phase of recovery?", lastQ],
    specialties: ["therapy", "neurology"],
  },
  {
    id: "chronic-pain-therapy", condition: "Chronic Pain / Functional Therapy", category: "Physical / Occupational / Speech Therapy", severity: "moderate",
    description: "Functional rehabilitation for chronic pain conditions. Covers pain neuroscience education, graded activity, fear-avoidance beliefs, functional goal setting, and self-management strategies.",
    questions: ["How is chronic pain affecting your ability to perform daily activities and work?", "Do you avoid certain movements or activities because you fear they will cause more pain?", "Have you learned about pain neuroscience — understanding that pain does not always equal damage?", "Are you gradually increasing your activity level even when pain is present?", "What are your most important functional goals — things you want to be able to do again?", "Are you using pacing strategies — breaking activities into manageable segments?", "How is your sleep quality — poor sleep amplifies pain perception?", "Are you experiencing anxiety or depression related to your chronic pain?", "Have you tried mind-body approaches — relaxation techniques, mindfulness, or guided imagery?", "Are you satisfied with your progress and do you feel empowered to manage your condition?", lastQ],
    specialties: ["therapy", "general-practice"],
  },
  {
    id: "balance-fall-risk", condition: "Balance / Fall Risk Assessment", category: "Physical / Occupational / Speech Therapy", severity: "moderate",
    description: "Fall risk assessment per CDC STEADI initiative. Covers fall history, Berg Balance Scale, gait analysis, home hazard evaluation, medication review (Beers Criteria), and strength/balance training.",
    questions: ["Have you fallen in the past 12 months — how many times and what were the circumstances?", "Do you feel unsteady when walking, standing up, or turning around?", "Are you using a cane, walker, or other assistive device for balance?", "Can you stand on one foot for at least 5 seconds without holding on?", "Have you reviewed your medications with your doctor — some increase fall risk?", "Are there tripping hazards in your home — throw rugs, poor lighting, clutter, stairs?", "Do you experience dizziness or lightheadedness when standing up quickly?", "Are you doing balance and strengthening exercises — tai chi, chair exercises, or physical therapy?", "Have you had your vision checked recently — poor vision increases fall risk?", "Do you have adequate calcium and vitamin D intake for bone health?", lastQ],
    specialties: ["therapy", "general-practice", "neurology"],
  },
  {
    id: "hand-therapy", condition: "Hand / Upper Extremity Rehab", category: "Physical / Occupational / Speech Therapy", severity: "moderate",
    description: "Upper extremity rehabilitation per ASHT guidelines. Covers grip and pinch strength, ROM, nerve function assessment, splinting, edema management, and return-to-work planning.",
    questions: ["How is your grip strength compared to your other hand — can you grip a cup or hold a pen?", "Can you fully open and close your fist and bend your wrist through full range of motion?", "Are you experiencing numbness, tingling, or weakness in your fingers — nerve symptoms?", "Are you wearing a splint or brace as prescribed — and when do you wear it?", "Do you have swelling in your hand, wrist, or forearm — and are you using elevation and compression?", "Are you doing your therapy exercises — tendon gliding, strengthening, and stretching?", "Can you perform fine motor tasks — buttoning shirts, writing, using utensils?", "Are you managing scar tissue — massage, silicone sheets, or stretching?", "What is your goal — return to work, sport, or independent daily activities?", "Do you have a follow-up with your hand surgeon or occupational therapist?", lastQ],
    specialties: ["therapy"],
  },

  // ── Gastroenterology ──────────────────────────────────────────────
  {
    id: "gastrointestinal", condition: "Gastrointestinal Issues", category: "Gastroenterology", severity: "moderate",
    description: "GI disorders including GERD, IBS, IBD, and functional dyspepsia. ACG/AGA guidelines recommend symptom-based assessment, alarm features screening (bleeding, weight loss), and appropriate endoscopic evaluation.",
    questions: ["Are you experiencing any abdominal pain — where is it and how severe?", "Have you had any heartburn, acid reflux, or regurgitation after meals?", "How would you describe your bowel movements — frequency, consistency, any blood?", "Have you noticed any blood — bright red or dark/tarry — in your stool?", "Are you following your recommended diet and avoiding trigger foods?", "Are you taking your GI medications (PPI, antispasmodics, biologics) as prescribed?", "Have you had any nausea, vomiting, or difficulty swallowing?", "Are you experiencing bloating, excessive gas, or feeling full quickly?", "Has your appetite changed or have you had unintentional weight loss?", "Have you had recent GI procedures — colonoscopy, endoscopy — and do you have results?", lastQ],
    specialties: ["gastroenterology"],
  },
  {
    id: "gerd", condition: "GERD / Acid Reflux", category: "Gastroenterology", severity: "moderate",
    description: "Gastroesophageal reflux disease per ACG guidelines. Covers symptom frequency, PPI response, lifestyle modifications, alarm features (dysphagia, weight loss, bleeding), and erosive esophagitis assessment.",
    questions: ["How often do you experience heartburn or acid regurgitation — daily, weekly, or less?", "Are your symptoms worse after meals, when lying down, or with certain foods?", "Are you taking a proton pump inhibitor (PPI) — and is it providing adequate relief?", "Have you tried lifestyle modifications — elevating head of bed, avoiding late meals, weight loss?", "Do you have difficulty swallowing, food getting stuck, or pain with swallowing?", "Have you experienced any alarm symptoms — unexplained weight loss, vomiting, or blood in stool?", "Do you have a chronic cough, hoarse voice, or asthma-like symptoms that may be GERD-related?", "How long have you been on your current PPI — have you tried stepping down therapy?", "Have you had an upper endoscopy to assess for esophagitis or Barrett's esophagus?", "Are you avoiding common triggers — chocolate, caffeine, alcohol, fatty foods, citrus, tomatoes?", lastQ],
    specialties: ["gastroenterology"],
  },
  {
    id: "ibd-crohns", condition: "Crohn's Disease", category: "Gastroenterology", severity: "high",
    description: "Crohn's disease management per ACG/AGA guidelines. Covers disease location, flare assessment, biologic compliance, fistula/stricture monitoring, nutritional status, and extraintestinal manifestations.",
    questions: ["Are you currently in a Crohn's flare — increased abdominal pain, diarrhea, or blood in stool?", "How many bowel movements are you having per day during this flare?", "Are you taking your biologic medication (infliximab, adalimumab, vedolizumab) as scheduled?", "Have you noticed any fistula symptoms — drainage, abscess, or pain near the perianal area?", "Are you experiencing any joint pain, eye inflammation, or skin lesions (extraintestinal manifestations)?", "How is your nutrition — are you maintaining weight, or experiencing nutrient deficiencies?", "Have you had any fever, night sweats, or unexplained weight loss recently?", "When was your last colonoscopy or imaging — what does it show about disease activity?", "Are you on any other medications — immunomodulators, corticosteroids, antibiotics?", "Do you have a gastroenterologist following your Crohn's disease with a maintenance plan?", lastQ],
    specialties: ["gastroenterology"],
  },
  {
    id: "ibd-colitis", condition: "Ulcerative Colitis", category: "Gastroenterology", severity: "high",
    description: "Ulcerative colitis management per ACG/AGA guidelines. Covers disease extent (proctitis, left-sided, pancolitis), stool frequency, bleeding, biologic/5-ASA compliance, and colectomy risk assessment.",
    questions: ["How many bowel movements are you having per day and is there blood in your stool?", "Are you experiencing urgency — the need to rush to the bathroom?", "Are you taking your 5-ASA medication (mesalamine) or biologic as prescribed?", "Have you had any fever, abdominal pain, or signs of toxic megacolon?", "How is your disease extent — proctitis, left-sided colitis, or pancolitis?", "Have you had your recent lab work — CBC, CRP, fecal calprotectin?", "When was your last colonoscopy and what did it show about disease activity?", "Are you experiencing joint pain, mouth ulcers, or skin problems alongside your UC?", "Have you discussed surgical options — colectomy — if medical therapy fails?", "How is your nutritional status — are you maintaining adequate weight and hydration?", lastQ],
    specialties: ["gastroenterology"],
  },
  {
    id: "ibs", condition: "IBS / Functional GI", category: "Gastroenterology", severity: "moderate",
    description: "Irritable bowel syndrome per ACG guidelines using Rome IV criteria. Covers IBS subtype (constipation-predominant, diarrhea-predominant, mixed), trigger identification, diet response, and quality of life.",
    questions: ["Would you describe your IBS as diarrhea-predominant, constipation-predominant, or mixed?", "How many bowel movements do you have per day or per week?", "Do your symptoms worsen after eating certain foods — which ones have you identified?", "Are you following a low-FODMAP diet or other dietary modification?", "How much bloating, gas, or abdominal cramping do you experience?", "Are you taking any IBS medications — antispasmodics, fiber supplements, loperamide?", "How is IBS affecting your work, social life, and emotional well-being?", "Have you had any red flag symptoms — blood in stool, weight loss, anemia, family history of IBD?", "Are you managing stress and anxiety, which often trigger IBS symptoms?", "Have you tried probiotics, and if so, which strains and has there been improvement?", lastQ],
    specialties: ["gastroenterology"],
  },
  {
    id: "celiac-disease", condition: "Celiac Disease", category: "Gastroenterology", severity: "moderate",
    description: "Celiac disease management per ACG guidelines. Covers strict gluten-free diet compliance, cross-contamination avoidance, nutrient deficiency monitoring, serologic response, and refractory disease assessment.",
    questions: ["Are you following a strict gluten-free diet — avoiding wheat, barley, rye, and cross-contamination?", "How careful are you about reading food labels for hidden gluten?", "Have your GI symptoms improved since going gluten-free — bloating, diarrhea, pain?", "Have you had follow-up serology (tTG-IgA) to check if your antibodies have normalized?", "Are you taking nutritional supplements — iron, calcium, vitamin D, B12 — as recommended?", "Do you experience accidental gluten exposure — how often and what symptoms occur?", "Have you had a bone density scan (DEXA) to assess for osteoporosis?", "Are you seeing a registered dietitian who specializes in celiac disease?", "Do you have any persistent symptoms despite a gluten-free diet (refractory celiac)?", "Are you aware of cross-reacting foods and hidden gluten sources (sauces, medications, cosmetics)?", lastQ],
    specialties: ["gastroenterology"],
  },
  {
    id: "hepatitis", condition: "Hepatitis / Liver Disease", category: "Gastroenterology", severity: "high",
    description: "Hepatitis and chronic liver disease management per AASLD guidelines. Covers hepatitis type (A, B, C), antiviral treatment, liver function monitoring, cirrhosis complications, and alcohol abstinence.",
    questions: ["What type of hepatitis do you have — A, B, C, or autoimmune?", "Are you currently on antiviral treatment — and how is it going?", "Have your liver function tests (ALT, AST, bilirubin) been monitored recently?", "Are you completely abstinent from alcohol — even small amounts can damage a diseased liver?", "Have you had any signs of cirrhosis — jaundice, ascites, variceal bleeding, confusion?", "Are you on a hepatoprotective diet — low sodium, adequate protein, avoid raw shellfish?", "Have you been vaccinated for hepatitis A and B if indicated?", "Are you avoiding hepatotoxic medications — including acetaminophen and certain supplements?", "Do you have regular hepatocellular carcinoma screening (ultrasound + AFP) if you have cirrhosis?", "Are you eligible for or have you been cured of hepatitis C with DAAs?", lastQ],
    specialties: ["gastroenterology", "oncology"],
  },

  // ── Endocrinology ─────────────────────────────────────────────────
  {
    id: "diabetes", condition: "Diabetes (Type 1 & 2)", category: "Endocrinology", severity: "high",
    description: "Chronic metabolic disorder characterized by hyperglycemia from insulin deficiency or resistance. Screening includes HbA1c, fasting glucose, and assessment of microvascular complications.",
    questions: ["What was your most recent HbA1c or fasting blood sugar reading?", "Are you experiencing any symptoms of hypoglycemia or hyperglycemia?", "Have you taken your diabetes medication or insulin as prescribed today?", "Have you had any episodes of dizziness, confusion, or loss of consciousness?", "Are you following your recommended meal plan and counting carbohydrates?", "Have you noticed any vision changes, numbness, or tingling in your feet?", "Have you checked your feet for cuts, blisters, or sores this week?", "How many times have you had low blood sugar episodes in the past week?", "Are you experiencing excessive thirst, frequent urination, or unexplained weight loss?", "Have you had your annual diabetic eye exam and kidney function tests?", lastQ],
    specialties: ["endocrinology"],
  },
  {
    id: "thyroid", condition: "Thyroid Disorders", category: "Endocrinology", severity: "moderate",
    description: "Hypothyroidism or hyperthyroidism affecting metabolism. ATA guidelines recommend TSH-based screening and monitoring for symptoms of hormone excess or deficiency.",
    questions: ["Are you taking your thyroid medication regularly and at the correct dose?", "Have you noticed any changes in your energy level or fatigue?", "Has your weight changed significantly — gain or loss — without trying?", "Are you feeling unusually hot or cold compared to others?", "Have you noticed changes in your heart rate — racing or slow?", "Are you experiencing any hair thinning, dry skin, or brittle nails?", "Have you had any tremors in your hands or muscle weakness?", "Have you noticed any swelling in your neck or difficulty swallowing?", "Are you having trouble with memory, concentration, or brain fog?", "When was your last thyroid function test (TSH, T4, T3) and what were the results?", lastQ],
    specialties: ["endocrinology"],
  },
  {
    id: "osteoporosis", condition: "Osteoporosis / Bone Health", category: "Endocrinology", severity: "moderate",
    description: "Osteoporosis management per Endocrine Society guidelines. Covers DEXA scoring (T-score), fall prevention, calcium and vitamin D supplementation, fracture risk assessment (FRAX), and pharmacotherapy eligibility.",
    questions: ["What is your most recent DEXA scan T-score and when was it performed?", "Have you had any fractures from minor trauma — wrist, spine, or hip?", "Are you taking calcium (1000-1200 mg/day) and vitamin D (800-1000 IU/day) supplements?", "Are you on any osteoporosis medication — bisphosphonate, denosumab, or teriparatide?", "Are you doing weight-bearing and resistance exercises to strengthen bones?", "Have you had a fall risk assessment — home hazards, vision, balance?", "Are you avoiding medications that worsen bone loss — chronic steroids, PPIs?", "Do you have a history of smoking or excessive alcohol use?", "Have you had your height measured — height loss may indicate vertebral fractures?", "Are you aware of the benefits and risks of your osteoporosis medication?", lastQ],
    specialties: ["endocrinology", "rheumatology"],
  },
  {
    id: "metabolic-syndrome", condition: "Metabolic Syndrome", category: "Endocrinology", severity: "moderate",
    description: "Metabolic syndrome diagnosis requires ≥3 of: elevated waist circumference, triglycerides, low HDL, elevated BP, elevated fasting glucose. AHA/NHLBI guidelines emphasize lifestyle intervention as first-line therapy.",
    questions: ["Do you know your waist circumference — is it above 40 inches (men) or 35 inches (women)?", "Have you had recent blood work showing elevated triglycerides, low HDL, or fasting glucose?", "What is your current blood pressure and how is it being managed?", "How many minutes of moderate-intensity exercise do you get per week?", "How would you describe your diet — are you limiting processed foods, sugar, and saturated fat?", "Have you lost weight if recommended — even 5-10% body weight can improve metabolic parameters?", "Are you managing your stress, which can worsen metabolic syndrome?", "Do you have a family history of diabetes, heart disease, or stroke?", "Are you taking any medications — statin, metformin, blood pressure medication?", "Are you monitoring your blood sugar at home if you have prediabetes or diabetes?", lastQ],
    specialties: ["endocrinology", "general-practice"],
  },
  {
    id: "adrenal-disorders", condition: "Adrenal Disorders (Cushing's/Addison's)", category: "Endocrinology", severity: "high",
    description: "Adrenal insufficiency (Addison's) and cortisol excess (Cushing's) per Endocrine Society guidelines. Covers hormone replacement, adrenal crisis prevention, cortisol monitoring, and comorbidity management.",
    questions: ["Do you have Addison's disease (insufficiency) or Cushing's syndrome (excess)?", "Are you taking your hydrocortisone or fludrocortisone replacement as prescribed?", "Are you aware of sick-day rules — doubling or tripling your dose during illness?", "Do you carry an emergency injection kit and medical alert identification?", "If you have Cushing's, are you experiencing weight gain, moon face, buffalo hump, or skin striae?", "Have you had any adrenal crisis symptoms — severe fatigue, vomiting, low blood pressure, confusion?", "Are you monitoring your blood pressure and electrolytes regularly?", "How is your bone health — both conditions can affect calcium and bone density?", "Are you managing your blood sugar — both conditions can cause glucose abnormalities?", "Do you have regular endocrine follow-up with hormone level monitoring?", lastQ],
    specialties: ["endocrinology"],
  },
  {
    id: "pcos", condition: "PCOS / Reproductive Endocrine", category: "Endocrinology", severity: "moderate",
    description: "Polycystic ovary syndrome per international evidence-based guidelines. Covers menstrual irregularity, hyperandrogenism, insulin resistance, fertility goals, and metabolic comorbidity screening.",
    questions: ["How regular are your menstrual cycles — are they irregular, absent, or infrequent?", "Are you experiencing excess hair growth, acne, or hair thinning on your scalp?", "Have you been diagnosed with insulin resistance or are you taking metformin?", "What are your current fertility goals — trying to conceive or seeking contraception?", "Have you had your testosterone and other androgen levels checked?", "Are you following a healthy diet and exercise regimen to manage weight and insulin resistance?", "Have you had your cholesterol, blood sugar, and blood pressure checked recently?", "Are you experiencing any mood changes, anxiety, or depression?", "What treatment are you on — combined oral contraceptive, progestin, or fertility medications?", "Do you understand the long-term health risks of PCOS — diabetes, heart disease, endometrial cancer?", lastQ],
    specialties: ["endocrinology"],
  },

  // ── Oncology ──────────────────────────────────────────────────────
  {
    id: "cancer-followup", condition: "Cancer Follow-up", category: "Oncology", severity: "critical",
    description: "Surveillance for recurrence and management of treatment-related side effects per NCCN survivorship guidelines. Includes pain assessment, new symptoms, and psychosocial support needs.",
    questions: ["Are you experiencing any new pain, lumps, or persistent symptoms?", "Are you taking all prescribed medications including cancer treatments and supportive care?", "Have you had any changes in appetite, unintentional weight loss, or gain?", "Are you experiencing any treatment side effects — fatigue, nausea, neuropathy?", "Have you had any fevers, infections, or unusual bleeding or bruising?", "Are you keeping your scheduled oncology follow-ups and imaging appointments?", "Have you noticed any new swelling in your lymph nodes or elsewhere?", "Are you feeling unusually tired or weak compared to two weeks ago?", "How is your emotional well-being — are you feeling anxious, depressed, or overwhelmed?", "Do you have a survivorship care plan and know what symptoms require immediate attention?", lastQ],
    specialties: ["oncology"],
  },
  {
    id: "chemo-side-effects", condition: "Chemotherapy Side Effects", category: "Oncology", severity: "high",
    description: "Chemotherapy toxicity management per ASCO/NCCN guidelines. Covers myelosuppression (neutropenia, anemia, thrombocytopenia), nausea, peripheral neuropathy, mucositis, and treatment modification needs.",
    questions: ["What chemotherapy regimen are you receiving and when was your last cycle?", "Have you experienced nausea or vomiting — is it controlled with antiemetics?", "Have you had any fever above 100.4°F or signs of infection (neutropenic precaution)?", "Are you experiencing numbness or tingling in your hands or feet (peripheral neuropathy)?", "Have you noticed any unusual bleeding, bruising, or petechiae (low platelets)?", "How is your energy level — are you experiencing severe fatigue or weakness?", "Have you had mouth sores, difficulty eating, or changes in taste (mucositis)?", "Are you managing hair loss and body image changes — do you need support resources?", "Have you had recent blood counts — WBC, hemoglobin, platelets?", "Are you keeping your oncology appointments and communicating side effects to your team?", lastQ],
    specialties: ["oncology"],
  },
  {
    id: "cancer-survivorship", condition: "Cancer Survivorship", category: "Oncology", severity: "moderate",
    description: "Cancer survivorship care per ASCO survivorship guidelines. Covers surveillance for recurrence, management of late effects, healthy lifestyle promotion, and psychosocial well-being.",
    questions: ["What type of cancer were you treated for and when did treatment end?", "Are you keeping your surveillance appointments — imaging, lab work, clinic visits?", "Have you noticed any new symptoms that concern you — pain, weight loss, fatigue?", "Are you experiencing any late effects of treatment — lymphedema, neuropathy, cognitive changes?", "Have you adopted healthier lifestyle behaviors — exercise, nutrition, smoking cessation?", "How is your emotional health — are you dealing with fear of recurrence, anxiety, or depression?", "Do you have a written survivorship care plan from your oncology team?", "Are you getting appropriate age- and risk-appropriate cancer screenings?", "How is your sexual health and fertility — have these been addressed?", "Do you have a primary care provider who understands your cancer history?", lastQ],
    specialties: ["oncology"],
  },
  {
    id: "radiation-therapy", condition: "Radiation Therapy Follow-up", category: "Oncology", severity: "high",
    description: "Post-radiation therapy monitoring per NCCN guidelines. Covers acute and late radiation effects, organ-specific toxicity, skin care, fatigue management, and long-term surveillance.",
    questions: ["What area was treated with radiation and how many treatments did you receive?", "Are you experiencing any skin reactions — redness, peeling, or blistering in the treatment area?", "How is your fatigue level — radiation fatigue can persist for weeks after treatment ends?", "Are you experiencing any organ-specific symptoms related to the radiation field?", "If head/neck radiation — are you having difficulty swallowing, dry mouth, or taste changes?", "If chest radiation — are you experiencing cough, shortness of breath, or heart symptoms?", "If pelvic radiation — are you having bladder or bowel symptoms?", "Are you using skin care products recommended for radiation dermatitis?", "Have you completed your radiation course and when is your follow-up imaging scheduled?", "Are you aware of long-term risks of radiation — secondary cancers, organ damage?", lastQ],
    specialties: ["oncology"],
  },
  {
    id: "palliative-care", condition: "Palliative / Comfort Care", category: "Oncology", severity: "critical",
    description: "Palliative care and symptom management per NCCN guidelines. Covers pain management, symptom burden, goals of care discussions, advance care planning, and hospice readiness assessment.",
    questions: ["What is your current pain level and is your pain management regimen effective?", "Are you experiencing other symptoms — nausea, shortness of breath, fatigue, anxiety?", "Have you had goals of care discussions with your healthcare team?", "Do you have advance directives — healthcare power of attorney, living will?", "Are your symptoms being managed well enough for you to have quality of life?", "Would you like to discuss hospice care or comfort-focused treatment?", "Are you and your family receiving emotional and spiritual support?", "Do you understand your prognosis and treatment options at this stage?", "Is there anything that is most important to you in terms of your care priorities?", "Are you experiencing any distress that is not being addressed by your current care plan?", lastQ],
    specialties: ["oncology", "general-practice"],
  },

  // ── Rheumatology ──────────────────────────────────────────────────
  {
    id: "arthritis", condition: "Arthritis & Joint Pain", category: "Rheumatology", severity: "moderate",
    description: "Inflammatory (rheumatoid) or degenerative (osteoarthritis) joint disease. ACR guidelines emphasize treat-to-target with DMARDs for RA and functional assessment with PROMs for OA.",
    questions: ["Which joints are bothering you most today and how would you rate the pain (0-10)?", "How long does your morning stiffness last — less than or more than 30 minutes?", "Are you taking your anti-inflammatory or DMARD medication as prescribed?", "Have you noticed any joint swelling, redness, or warmth?", "Are you able to perform your usual daily activities (dressing, cooking, work)?", "Have you had any medication side effects such as nausea, fatigue, or bruising?", "Are you doing your recommended physical therapy or home exercises?", "Has the pain affected your sleep quality this week?", "Have you needed any assistance or adaptive devices for daily tasks?", "When was your last rheumatology follow-up and lab work (CRP, ESR)?", lastQ],
    specialties: ["rheumatology"],
  },
  {
    id: "lupus-sle", condition: "Lupus (SLE)", category: "Rheumatology", severity: "high",
    description: "Systemic lupus erythematosus management per EULAR/ACR guidelines. Covers flare monitoring, organ involvement screening (renal, cardiac, pulmonary), photosensitivity, and immunosuppressive therapy compliance.",
    questions: ["Are you experiencing any lupus flare symptoms — fatigue, joint pain, rash, fever?", "Have you noticed any new butterfly rash, skin lesions, or photosensitivity reactions?", "Are you taking your hydroxychloroquine (Plaquenil) — have you had your annual eye exam?", "Have you had any chest pain, shortness of breath, or kidney problems (foamy urine, edema)?", "Are you on any immunosuppressive medications — mycophenolate, azathioprine, methotrexate?", "How is your energy level and ability to perform daily activities?", "Are you protecting yourself from sun exposure — SPF 50+, hats, protective clothing?", "Have you had recent blood work — CBC, complement levels (C3, C4), anti-dsDNA?", "Are you experiencing any cognitive symptoms — memory problems, difficulty concentrating?", "Are you using effective contraception — some lupus medications are teratogenic?", lastQ],
    specialties: ["rheumatology"],
  },
  {
    id: "fibromyalgia", condition: "Fibromyalgia", category: "Rheumatology", severity: "moderate",
    description: "Fibromyalgia assessment per ACR diagnostic criteria. Covers widespread pain index, symptom severity, fatigue, cognitive symptoms, sleep disturbance, and multimodal treatment approach.",
    questions: ["How widespread is your pain — does it affect both sides of your body above and below the waist?", "On a scale of 0 to 10, what is your average pain level and how does it fluctuate?", "How severe is your fatigue — do you feel exhausted even after a full night's sleep?", "Are you experiencing cognitive difficulties — brain fog, memory problems, difficulty concentrating?", "How is your sleep quality — do you wake unrefreshed despite adequate sleep time?", "Are you taking any medications for fibromyalgia — pregabalin, duloxetine, milnacipran?", "Are you exercising regularly — gentle aerobic exercise is a cornerstone of fibromyalgia treatment?", "How is fibromyalgia affecting your work, relationships, and daily functioning?", "Are you experiencing any co-existing conditions — IBS, headaches, anxiety, depression?", "Have you tried non-pharmacologic approaches — CBT, tai chi, yoga, mindfulness?", lastQ],
    specialties: ["rheumatology", "psychiatry"],
  },
  {
    id: "gout", condition: "Gout", category: "Rheumatology", severity: "moderate",
    description: "Gout management per ACR 2020 guidelines. Covers acute flare treatment, urate-lowering therapy compliance, dietary triggers, tophus assessment, and comorbidity management (CKD, CV disease).",
    questions: ["Are you currently having a gout flare — which joint is affected and how severe is the pain?", "How many gout flares have you had in the past 12 months?", "Are you taking your urate-lowering therapy (allopurinol, febuxostat) as prescribed?", "If on allopurinol, has your dose been titrated to target uric acid <6 mg/dL?", "Are you avoiding high-purine foods — organ meats, shellfish, red meat, beer?", "Have you noticed any tophi — hard lumps under the skin near joints?", "How much alcohol do you consume, especially beer and spirits?", "Are you staying well hydrated — dehydration can trigger gout flares?", "Are you managing your other conditions — hypertension, diabetes, kidney disease?", "Do you have a gout action plan for acute flares — colchicine, NSAIDs, or steroids?", lastQ],
    specialties: ["rheumatology"],
  },
  {
    id: "spondyloarthropathy", condition: "Ankylosing Spondylitis", category: "Rheumatology", severity: "high",
    description: "Axial spondyloarthritis management per AAS/ACR guidelines. Covers spinal mobility (Schober test), enthesitis, biologic compliance, posture exercises, and extra-articular manifestations.",
    questions: ["How is your back pain — is it worse in the morning and improves with activity?", "How long does your morning stiffness last — does it persist for more than 30 minutes?", "Can you touch your toes — has your spinal mobility changed over time?", "Are you experiencing any eye redness, pain, or light sensitivity (uveitis)?", "Are you taking your biologic medication (TNF inhibitor or IL-17 inhibitor) as prescribed?", "Do you have heel pain, Achilles tendon pain, or other enthesitis symptoms?", "Are you doing daily stretching and posture exercises to maintain spinal flexibility?", "Have you noticed any joint swelling in your hips, knees, or shoulders?", "How is your sleep quality — does back pain wake you up at night?", "Have you had imaging of your sacroiliac joints and spine to monitor disease progression?", lastQ],
    specialties: ["rheumatology"],
  },
  {
    id: "vasculitis", condition: "Vasculitis", category: "Rheumatology", severity: "high",
    description: "Vasculitis assessment per ACR/EULAR guidelines. Covers vessel involvement (large, medium, small), organ damage, immunosuppression monitoring, and relapse detection.",
    questions: ["What type of vasculitis have you been diagnosed with — which vessels are affected?", "Are you experiencing any new symptoms — skin purpura, ulcers, nerve pain, or organ involvement?", "Are you taking your immunosuppressive medications — steroids, rituximab, cyclophosphamide?", "Have you had any signs of relapse — recurrence of original symptoms?", "Are you monitoring your blood pressure — some vasculitis types affect the kidneys?", "Have you had any vision changes, jaw claudication, or headaches (giant cell arteritis)?", "Are you experiencing any shortness of breath, cough, or hemoptysis (lung involvement)?", "How is your energy level and ability to perform daily activities?", "Have you had recent blood work — ESR, CRP, CBC, kidney function, urinalysis?", "Are you aware of infection risk from immunosuppression and do you have a prevention plan?", lastQ],
    specialties: ["rheumatology", "dermatology"],
  },

  // ── Nephrology ────────────────────────────────────────────────────
  {
    id: "kidney-disease", condition: "Kidney Disease", category: "Nephrology", severity: "critical",
    description: "Chronic kidney disease defined by GFR <60 or albuminuria >3 months. KDIGO guidelines recommend CGA staging (Cause, GFR, Albuminuria), CV risk assessment, and complication management.",
    questions: ["Are you following your renal diet (limiting salt, potassium, phosphorus)?", "Have you noticed any changes in your urination — frequency, color, or amount?", "Are you experiencing any swelling in your legs, face, or hands?", "Are you taking your blood pressure or diabetes medications as prescribed?", "Have you felt nauseous, lost your appetite, or had vomiting recently?", "Are you experiencing any itching, muscle cramps, or restless legs?", "Have you been short of breath or had difficulty catching your breath?", "Are you monitoring your fluid intake as recommended?", "Have you had your kidney function (eGFR) and urine albumin checked recently?", "Do you have a follow-up scheduled with your nephrologist?", lastQ],
    specialties: ["nephrology"],
  },
  {
    id: "dialysis", condition: "Dialysis Assessment", category: "Nephrology", severity: "critical",
    description: "Dialysis adequacy and access management per KDOQI guidelines. Covers hemodialysis vs peritoneal dialysis, vascular access patency, fluid management, dialysis dose (Kt/V), and quality of life.",
    questions: ["Are you on hemodialysis or peritoneal dialysis — and how many sessions per week?", "Is your dialysis access (fistula, graft, or catheter) functioning well — any problems?", "Are you following your fluid restriction between dialysis sessions?", "Have you had any low blood pressure, cramping, or dizziness during dialysis?", "Are you taking your phosphate binders and other medications as prescribed?", "Have your recent lab values been reviewed — potassium, phosphorus, albumin, hemoglobin?", "Are you eating enough protein on your dialysis diet?", "How is your energy level and ability to perform daily activities?", "Are you experiencing any infections, especially around your catheter site?", "Do you have a transplant evaluation scheduled or are you a candidate for kidney transplant?", lastQ],
    specialties: ["nephrology"],
  },
  {
    id: "kidney-stones", condition: "Kidney Stones / Prevention", category: "Nephrology", severity: "moderate",
    description: "Nephrolithiasis management per AUA guidelines. Covers stone composition analysis, metabolic workup, dietary modifications, hydration goals, and medical expulsive therapy.",
    questions: ["Have you passed your kidney stone or is it still causing symptoms?", "What is the composition of your stone — calcium oxalate, uric acid, strite, or cystine?", "Are you experiencing severe flank pain, nausea, or blood in your urine?", "How much water are you drinking daily — aim for 2.5-3 liters to produce dilute urine?", "Are you following dietary modifications based on your stone type?", "Have you had metabolic testing — 24-hour urine collection for calcium, oxalate, citrate?", "Are you taking any medications to prevent stone recurrence — potassium citrate, thiazide?", "Do you have a history of recurrent kidney stones?", "Are you avoiding high-oxalate foods (if calcium oxalate stone) — spinach, nuts, chocolate?", "Do you have an imaging follow-up scheduled to confirm the stone has passed?", lastQ],
    specialties: ["nephrology", "urology"],
  },
  {
    id: "kidney-transplant", condition: "Post-Transplant Care", category: "Nephrology", severity: "high",
    description: "Kidney transplant management per AST/ASN guidelines. Covers immunosuppression compliance, rejection surveillance, infection prevention, cardiovascular risk, and graft function monitoring.",
    questions: ["Are you taking all your immunosuppressive medications exactly as prescribed — never missing a dose?", "Have you experienced any signs of rejection — fever, decreased urine, swelling, tenderness over graft?", "Are you taking your medications on a consistent schedule — timing matters for tacrolimus levels?", "Have you had any infections — especially urinary tract, CMV, or BK virus?", "How is your graft function — what was your most recent creatinine and eGFR?", "Are you avoiding sun exposure and using sunscreen — increased skin cancer risk?", "Are you managing your blood pressure, blood sugar, and cholesterol?", "Have you had any episodes of high tacrolimus or cyclosporine levels?", "Are you up to date on vaccinations — but avoiding live vaccines?", "Do you have regular follow-up with your transplant team and are your labs drawn on schedule?", lastQ],
    specialties: ["nephrology"],
  },

  // ── Pulmonology ───────────────────────────────────────────────────
  {
    id: "asthma-copd", condition: "Asthma & COPD", category: "Pulmonology", severity: "high",
    description: "Chronic airway diseases — asthma is variable airflow obstruction with airway hyperresponsiveness; COPD is progressive airflow limitation from (usually) smoking. GINA/GOLD guidelines emphasize symptom control and exacerbation prevention.",
    questions: ["How many times have you used your rescue inhaler in the past 24 hours?", "Are you waking up at night due to coughing or wheezing?", "Can you walk up one flight of stairs without stopping for breath?", "Are you taking your daily maintenance inhaler as prescribed?", "Have you been exposed to any known triggers (smoke, allergens, cold air)?", "Have you had any chest tightness or shortness of breath at rest?", "Are you coughing up any colored or increased mucus?", "What is your peak flow reading today compared to your personal best?", "Have you had any emergency visits or hospitalizations since your last visit?", "Are you using proper inhaler technique — have you demonstrated it recently?", lastQ],
    specialties: ["pulmonology"],
  },
  {
    id: "sleep-apnea", condition: "Sleep Apnea / CPAP", category: "Pulmonology", severity: "moderate",
    description: "Obstructive sleep apnea management per AASM guidelines. Covers CPAP compliance (hours/night), AHI severity, mask fit, ESS score for daytime sleepiness, and comorbidity management.",
    questions: ["Are you using your CPAP machine every night — for how many hours per night?", "What is your AHI (apnea-hypopnea index) from your sleep study?", "Are you experiencing any mask discomfort, air leaks, or skin irritation?", "Do you feel more rested during the day since starting CPAP therapy?", "Are you still snoring or gasping for air when using CPAP?", "How is your Epworth Sleepiness Scale score — are you excessively drowsy during the day?", "Have you noticed improvement in your blood pressure since starting CPAP?", "Are you cleaning your CPAP equipment regularly — mask, tubing, water chamber?", "Do you have any nasal congestion that makes CPAP use difficult?", "Are you avoiding alcohol and sedatives that worsen sleep apnea?", lastQ],
    specialties: ["pulmonology", "ent"],
  },
  {
    id: "pulmonary-fibrosis", condition: "Pulmonary Fibrosis / ILD", category: "Pulmonology", severity: "high",
    description: "Interstitial lung disease and pulmonary fibrosis management per ATS/ERS guidelines. Covers disease progression, oxygen therapy, 6-minute walk distance, antifibrotic therapy, and transplant evaluation.",
    questions: ["How is your breathing — do you get short of breath with minimal activity?", "Are you using supplemental oxygen — at rest, with activity, or during sleep?", "What was your 6-minute walk distance and oxygen saturation at last testing?", "Are you taking your antifibrotic medication (nintedanib or pirfenidone)?", "Have you had a HRCT scan recently — is your fibrosis progressing?", "Do you have a dry, persistent cough that is not improving?", "Are you experiencing fatigue that limits your daily activities?", "Have you been evaluated for lung transplant referral?", "Are you avoiding respiratory irritants — dust, fumes, smoking?", "Are you keeping up with pulmonary rehabilitation and vaccinations (flu, pneumonia, COVID)?", lastQ],
    specialties: ["pulmonology"],
  },
  {
    id: "pneumonia-recovery", condition: "Pneumonia Recovery", category: "Pulmonology", severity: "moderate",
    description: "Pneumonia recovery monitoring per ATS/IDSA guidelines. Covers antibiotic completion, symptom resolution, chest X-ray follow-up, and distinguishing bacterial from viral etiology.",
    questions: ["How many days has it been since your pneumonia diagnosis — are symptoms improving?", "Is your cough getting better — less frequent, less productive?", "Have you completed your full course of antibiotics as prescribed?", "Are you still having fevers or do you feel feverish?", "How is your energy level — pneumonia recovery can take weeks for full energy return?", "Are you staying hydrated and eating nutritious meals?", "Have you had a follow-up chest X-ray to confirm the pneumonia is resolving?", "Are you at risk for pneumonia recurrence — do you need pneumococcal or influenza vaccines?", "Do you have any risk factors — smoking, COPD, immunosuppression, age over 65?", "Are you experiencing any persistent shortness of breath or chest pain?", lastQ],
    specialties: ["pulmonology", "general-practice"],
  },
  {
    id: "bronchitis", condition: "Acute / Chronic Bronchitis", category: "Pulmonology", severity: "moderate",
    description: "Bronchitis assessment per ACCP guidelines. Acute bronchitis is typically viral and self-limited; chronic bronchitis (COPD component) requires ongoing management. Antibiotic stewardship emphasized.",
    questions: ["How long have you had your cough — less than 3 weeks (acute) or more than 8 weeks (chronic)?", "Are you producing mucus — what color and how much?", "Do you have a fever or has it been present?", "Are you a current or former smoker — how many pack-years?", "Are you using any inhalers — bronchodilators or inhaled corticosteroids?", "Have you been around anyone with a respiratory infection?", "Is your cough interfering with sleep, work, or daily activities?", "Have you tried over-the-counter cough suppressants or expectorants?", "Do you have a history of asthma, COPD, or recurrent bronchitis?", "Would you benefit from smoking cessation support if applicable?", lastQ],
    specialties: ["pulmonology", "general-practice"],
  },

  // ── Ophthalmology ─────────────────────────────────────────────────
  {
    id: "glaucoma", condition: "Glaucoma Management", category: "Ophthalmology", severity: "high",
    description: "Glaucoma management per AAO Preferred Practice Patterns. Covers IOP monitoring, medication compliance, visual field progression, optic nerve assessment, and surgical intervention timing.",
    questions: ["What type of glaucoma do you have — open-angle, angle-closure, or normal-tension?", "Are you using your eye drops exactly as prescribed — correct number of drops and frequency?", "What is your current intraocular pressure (IOP) in each eye?", "Have you had any visual field changes — blind spots, tunnel vision, or decreased peripheral vision?", "When was your last visual field test and OCT — is your glaucoma stable or progressing?", "Are you experiencing any eye pain, redness, or blurred vision?", "Have you had any side effects from your glaucoma medications — eye redness, iris color change?", "Are you aware that glaucoma is lifelong and requires permanent treatment?", "Have you had laser treatment (SLT) or filtering surgery (trabeculectomy)?", "Does anyone in your family have glaucoma — is your condition being monitored appropriately?", lastQ],
    specialties: ["ophthalmology"],
  },
  {
    id: "diabetic-retinopathy", condition: "Diabetic Eye Disease", category: "Ophthalmology", severity: "high",
    description: "Diabetic retinopathy screening and management per AAO/ADA guidelines. Covers DR severity (NPDR, PDR, DME), anti-VEGF injection compliance, A1c correlation, and vision monitoring.",
    questions: ["When was your last dilated eye exam and what stage of diabetic retinopathy do you have?", "Have you noticed any vision changes — blurriness, floaters, dark spots, or vision loss?", "Have you received anti-VEGF injections (Lucentis, Eylea) — and are you keeping your injection schedule?", "What is your most recent HbA1c — good blood sugar control slows retinopathy progression?", "Are you managing your blood pressure and cholesterol to protect your vision?", "Are you experiencing any macular edema symptoms — central vision blurriness?", "Have you had any laser treatment (panretinal photocoagulation) for proliferative retinopathy?", "Are you aware that diabetic eye disease can progress without symptoms until advanced?", "Do you have a dilated eye exam scheduled at least annually?", "Are you avoiding smoking, which worsens diabetic eye disease?", lastQ],
    specialties: ["ophthalmology", "endocrinology"],
  },
  {
    id: "cataract-preop", condition: "Cataract Pre/Post-Op", category: "Ophthalmology", severity: "moderate",
    description: "Cataract surgery preparation and recovery per AAO guidelines. Covers visual acuity assessment, IOL selection (monofocal, multifocal, toric), preoperative measurements, and postoperative care.",
    questions: ["How is your vision affecting your daily activities — driving, reading, cooking?", "Have you had your preoperative measurements — biometry and corneal astigmatism?", "Which IOL (intraocular lens) type are you considering — monofocal, multifocal, or toric?", "Are you aware of the risks and benefits of cataract surgery?", "Do you have any other eye conditions — glaucoma, macular degeneration, dry eye?", "If post-surgery: are you using your eye drops (antibiotic and steroid) as prescribed?", "Are you avoiding heavy lifting, bending, and rubbing your eye after surgery?", "How is your vision after cataract surgery — has it improved as expected?", "Have you noticed any redness, pain, or vision changes that concern you after surgery?", "Do you have your postoperative follow-up appointments scheduled?", lastQ],
    specialties: ["ophthalmology"],
  },
  {
    id: "macular-degeneration", condition: "Macular Degeneration (AMD)", category: "Ophthalmology", severity: "high",
    description: "Age-related macular degeneration management per AAO guidelines. Covers dry vs wet AMD, anti-VEGF injection compliance, Amsler grid monitoring, and AREDS2 vitamin supplementation.",
    questions: ["Do you have dry AMD (drusen) or wet AMD (neovascularization)?", "Are you experiencing any central vision distortion — straight lines appearing wavy?", "Have you been using your Amsler grid daily to monitor for changes?", "If you have wet AMD, are you keeping your anti-VEGF injection appointments?", "Are you taking AREDS2 vitamins (lutein, zeaxanthin, zinc, copper) as recommended?", "How is your central vision for reading, driving, and recognizing faces?", "Are you aware that wet AMD requires urgent treatment to prevent permanent vision loss?", "Have you had recent OCT imaging to monitor for disease progression?", "Are you using magnifying aids or other low vision devices to help with daily tasks?", "Do you have any family history of macular degeneration — are you at high risk?", lastQ],
    specialties: ["ophthalmology"],
  },
  {
    id: "dry-eye", condition: "Dry Eye Disease", category: "Ophthalmology", severity: "low",
    description: "Dry eye disease assessment per TFOS DEWS II guidelines. Covers symptom severity (DEQ score), tear film quality, meibomian gland dysfunction, screen time habits, and treatment optimization.",
    questions: ["How would you rate your dry eye symptoms — burning, gritty feeling, or watery tearing?", "How many hours per day do you spend on screens — computer, phone, tablet?", "Are you using preservative-free artificial tears — and how often per day?", "Do your symptoms worsen in certain environments — air conditioning, wind, dry air?", "Have you noticed any improvement with warm compresses or eyelid hygiene?", "Do you have any autoimmune conditions — Sjögren's syndrome, rheumatoid arthritis?", "Are you blinking fully and frequently when using screens — or do you stare?", "Have you had any tear film or meibomian gland testing?", "Are you aware that contact lens wear can worsen dry eye symptoms?", "Would you benefit from prescription dry eye treatments — cyclosporine, lifitegrast, or punctal plugs?", lastQ],
    specialties: ["ophthalmology"],
  },
  {
    id: "retinal-detachment", condition: "Retinal Issues / Detachment", category: "Ophthalmology", severity: "critical",
    description: "Retinal detachment and related conditions are ophthalmic emergencies. Covers sudden vision changes, flashers and floaters, surgical repair outcomes, and postoperative positioning requirements.",
    questions: ["Have you experienced any sudden increase in floaters, flashes of light, or a shadow/curtain in your vision?", "Are you experiencing any vision loss — and is it getting worse?", "Have you been diagnosed with a retinal detachment, tear, or hole?", "If post-surgery: are you maintaining the required face-down or positional therapy?", "Are you using your postoperative eye drops as prescribed?", "Do you have any pain, redness, or swelling in the affected eye?", "How is your vision in the affected eye compared to before surgery?", "Are you avoiding heavy lifting, straining, and activities that increase eye pressure?", "Do you have a gas bubble in your eye — are you aware of air travel restrictions?", "Are you keeping your critical postoperative follow-up appointments?", lastQ],
    specialties: ["ophthalmology"],
  },

  // ── ENT ───────────────────────────────────────────────────────────
  {
    id: "sinusitis", condition: "Sinusitis / Sinus Infection", category: "ENT / Otolaryngology", severity: "moderate",
    description: "Acute and chronic sinusitis evaluation per AAO-HNS guidelines. Covers symptom duration (acute <4 weeks, chronic >12 weeks), antibiotic stewardship, nasal irrigation, and allergy management.",
    questions: ["How long have you had sinus symptoms — facial pain, pressure, nasal congestion, discharge?", "Are you experiencing thick, colored nasal discharge — and is it on one or both sides?", "Do you have facial pain or pressure that worsens when bending forward?", "Have you tried nasal saline irrigation — neti pot or NeilMed sinus rinse?", "Are you using any nasal steroid sprays (fluticasone, mometasone) or antihistamines?", "Have you had a course of antibiotics — and did your symptoms improve?", "Do you have a history of allergies that may be contributing to your sinus problems?", "Are you experiencing any fever, headache, or post-nasal drip?", "Have you had a CT scan of your sinuses to evaluate for chronic sinusitis?", "Do you have nasal polyps or has your doctor mentioned them?", lastQ],
    specialties: ["ent"],
  },
  {
    id: "hearing-loss-tinnitus", condition: "Hearing Loss / Tinnitus", category: "ENT / Otolaryngology", severity: "moderate",
    description: "Hearing loss and tinnitus evaluation per AAO-HNS guidelines. Covers audiometric testing results, hearing aid trial, tinnitus severity, noise exposure history, and medical vs surgical management.",
    questions: ["When did you first notice your hearing loss or tinnitus — was it gradual or sudden?", "Have you had a formal audiogram — what is the type and degree of your hearing loss?", "Are you using hearing aids — and if so, how often and how satisfied are you?", "How loud is your tinnitus — does it interfere with sleep, concentration, or daily activities?", "Have you been exposed to loud noise — occupational, military, recreational (concerts, shooting)?", "Have you tried any tinnitus management strategies — sound therapy, CBT, hearing aids?", "Do you have any ear pain, drainage, or history of recurrent ear infections?", "Are you taking any medications that can worsen hearing — aminoglycosides, high-dose aspirin?", "Have you experienced any sudden hearing loss — this is a medical emergency?", "Do you have difficulty understanding speech, especially in noisy environments?", lastQ],
    specialties: ["ent"],
  },
  {
    id: "tonsillectomy", condition: "Tonsillectomy Recovery", category: "ENT / Otolaryngology", severity: "moderate",
    description: "Tonsillectomy and adenoidectomy post-operative care per AAO-HNS guidelines. Covers pain management, diet progression, bleeding risk, sleep improvement, and return to normal activities.",
    questions: ["How many days has it been since your tonsillectomy or adenoidectomy?", "How is your pain level — are you taking your prescribed pain medication on schedule?", "Are you able to eat soft foods and drink enough fluids without difficulty?", "Have you noticed any bad breath, which is normal after tonsillectomy?", "Have you had any bleeding from your mouth or throat — this requires urgent attention?", "Are you avoiding hard, crunchy, or hot foods as instructed?", "How is your child sleeping — has snoring or sleep apnea improved?", "Are you staying well hydrated — dehydration increases healing complications?", "Have you had any fever above 101.5°F since the procedure?", "When is your postoperative follow-up and are you returning to school/work as scheduled?", lastQ],
    specialties: ["ent", "pediatrics"],
  },
  {
    id: "allergic-rhinitis", condition: "Allergic Rhinitis", category: "ENT / Otolaryngology", severity: "low",
    description: "Allergic rhinitis management per AAO-HNS/ACAAI guidelines. Covers allergen identification, antihistamine and nasal steroid use, immunotherapy eligibility, and environmental control measures.",
    questions: ["What are your allergy symptoms — sneezing, runny nose, nasal congestion, itchy eyes?", "Are your symptoms seasonal (pollen) or perennial (dust mites, pets, mold)?", "Are you taking antihistamines (cetirizine, loratadine) and nasal steroid sprays?", "Have you tried allergen avoidance measures — mattress covers, HEPA filters, pet-free bedroom?", "Are your allergy symptoms affecting your sleep, work, or quality of life?", "Have you had allergy testing (skin prick or specific IgN) to identify your triggers?", "Are you a candidate for allergen immunotherapy (allergy shots or sublingual tablets)?", "Are you using eye drops for allergic conjunctivitis — itchy, watery eyes?", "Do you have any asthma symptoms alongside your allergic rhinitis?", "Are you aware of medication interactions — some cold medications worsen allergies?", lastQ],
    specialties: ["ent", "dermatology"],
  },
  {
    id: "menieres-disease", condition: "Meniere's Disease / Vertigo", category: "ENT / Otolaryngology", severity: "moderate",
    description: "Meniere's disease and vestibular disorders per AAO-HNS guidelines. Covers vertigo episodes, hearing fluctuations, tinnitus, aural fullness, salt restriction, and vestibular rehabilitation.",
    questions: ["How often are you experiencing vertigo episodes — and how long do they last?", "Do you have fluctuating hearing loss, tinnitus, or a feeling of fullness in your ear?", "Are you following a low-sodium diet — less than 1500 mg per day?", "Are you taking any medications for vertigo — meclizine, betahistine, or diuretics?", "Are you avoiding triggers — caffeine, alcohol, chocolate, stress?", "Have you had an audiogram documenting your hearing changes over time?", "Do you have any balance problems between vertigo episodes?", "Are you participating in vestibular rehabilitation therapy?", "How are your vertigo episodes affecting your work and daily activities?", "Have you been evaluated for other causes of vertigo — BPPV, vestibular neuritis, acoustic neuroma?", lastQ],
    specialties: ["ent", "neurology"],
  },
  {
    id: "voice-disorders", condition: "Vocal Cord / Voice Disorders", category: "ENT / Otolaryngology", severity: "moderate",
    description: "Voice disorders evaluation per AAO-HNS guidelines. Covers vocal cord nodules, polyps, paralysis, laryngopharyngeal reflux, and voice therapy. Laryngoscopy is the diagnostic standard.",
    questions: ["How has your voice changed — hoarseness, breathiness, strain, or reduced volume?", "When did your voice problem start — suddenly or gradually?", "Do you use your voice professionally — teacher, singer, speaker, call center?", "Do you have any throat clearing, coughing, or sensation of a lump in your throat?", "Are you experiencing acid reflux or heartburn that may be irritating your vocal cords?", "Have you had a laryngoscopy or stroboscopy to visualize your vocal cords?", "Are you avoiding vocal strain — whispering, shouting, or prolonged speaking?", "Have you been referred to a speech-language pathologist for voice therapy?", "Do you smoke or vape — this is a major risk factor for voice disorders?", "Are you staying well hydrated and using good vocal hygiene practices?", lastQ],
    specialties: ["ent"],
  },
];
