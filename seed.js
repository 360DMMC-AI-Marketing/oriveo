var orgId = ObjectId("6a554f5f68ed3185349a78bf");

// Clean existing seedable data for this org
db.patients.deleteMany({ organization: orgId });
db.groups.deleteMany({ organization: orgId });
db.calls.deleteMany({ organization: orgId });
db.appointments.deleteMany({ organization: orgId });
db.rooms.deleteMany({ organization: orgId });
db.knowledgedocs.deleteMany({ organization: orgId });
db.notifications.deleteMany({ organization: orgId });

// ========== PATIENTS (50+) ==========
var patients = [];
var patientData = [
  // Human patients - General
  { name: "James Wilson", phone: "+12025551201", email: "jwilson@email.com", language: "en", primaryDiagnosis: "Type 2 Diabetes", chronicConditions: "Hypertension, Hyperlipidemia", allergies: "Sulfa", currentMedications: "Metformin 500mg, Lisinopril 10mg", patientType: "human", address: "123 Main St, New York, NY" },
  { name: "Maria Garcia", phone: "+12025551202", email: "mgarcia@email.com", language: "es", primaryDiagnosis: "Asthma", chronicConditions: "Allergic Rhinitis", allergies: "Penicillin", currentMedications: "Albuterol inhaler PRN, Fluticasone", patientType: "human", address: "456 Oak Ave, New York, NY" },
  { name: "Robert Chen", phone: "+12025551203", email: "rchen@email.com", language: "en", primaryDiagnosis: "Coronary Artery Disease", chronicConditions: "Hypertension, Diabetes", allergies: "None", currentMedications: "Aspirin 81mg, Atorvastatin 20mg, Metoprolol 25mg", patientType: "human", address: "789 Pine Rd, New York, NY" },
  { name: "Sarah Johnson", phone: "+12025551204", email: "sjohnson@email.com", language: "en", primaryDiagnosis: "Major Depressive Disorder", chronicConditions: "Anxiety", allergies: "Codeine", currentMedications: "Sertraline 50mg, Bupropion 150mg", patientType: "human", address: "321 Elm St, New York, NY" },
  { name: "Ahmed Hassan", phone: "+12025551205", email: "ahassan@email.com", language: "en", primaryDiagnosis: "Chronic Kidney Disease Stage 3", chronicConditions: "Hypertension, Diabetes", allergies: "Iodine", currentMedications: "Losartan 50mg, Insulin glargine", patientType: "human", address: "555 Maple Dr, New York, NY" },
  { name: "Emily Davis", phone: "+12025551206", email: "edavis@email.com", language: "en", primaryDiagnosis: "Rheumatoid Arthritis", chronicConditions: "Osteoporosis", allergies: "NSAIDs", currentMedications: "Methotrexate 15mg weekly, Folic acid, Prednisone 5mg", patientType: "human", address: "777 Cedar Ln, New York, NY" },
  { name: "Pierre Dubois", phone: "+12025551207", email: "pdubois@email.com", language: "fr", primaryDiagnosis: "COPD", chronicConditions: "Emphysema, Hypertension", allergies: "Sulfa", currentMedications: "Tiotropium, Salmeterol, Prednisone PRN", patientType: "human", address: "888 Birch Ct, New York, NY" },
  { name: "Laura Mueller", phone: "+12025551208", email: "lmueller@email.com", language: "de", primaryDiagnosis: "Hypothyroidism", chronicConditions: "Obesity", allergies: "Latex", currentMedications: "Levothyroxine 75mcg", patientType: "human", address: "999 Walnut Way, New York, NY" },
  { name: "Carlos Silva", phone: "+12025551209", email: "csilva@email.com", language: "pt", primaryDiagnosis: "Glaucoma", chronicConditions: "Diabetes, Hypertension", allergies: "Timolol", currentMedications: "Latanoprost, Metformin, Amlodipine", patientType: "human", address: "111 Spruce St, New York, NY" },
  { name: "Yuki Tanaka", phone: "+12025551210", email: "ytanaka@email.com", language: "en", primaryDiagnosis: "Migraine", chronicConditions: "Tension headaches", allergies: "Sumatriptan", currentMedications: "Topiramate 50mg, Rizatriptan PRN", patientType: "human", address: "222 Willow Ave, New York, NY" },

  // Human patients - Cardiology
  { name: "Thomas Brown", phone: "+12025551211", email: "tbrown@email.com", language: "en", primaryDiagnosis: "Atrial Fibrillation", chronicConditions: "Heart failure, Hypertension", allergies: "Statins", currentMedications: "Apixaban 5mg, Digoxin 0.125mg, Furosemide 40mg", patientType: "human", address: "333 Ash Blvd, New York, NY" },
  { name: "Patricia Miller", phone: "+12025551212", email: "pmiller@email.com", language: "en", primaryDiagnosis: "Congestive Heart Failure", chronicConditions: "CAD, Diabetes, CKD", allergies: "ACE inhibitors", currentMedications: "Carvedilol 6.25mg, Spironolactone 25mg, Empagliflozin", patientType: "human", address: "444 Poplar Rd, New York, NY" },
  { name: "Kevin Hall", phone: "+12025551213", email: "khall@email.com", language: "en", primaryDiagnosis: "Hypertensive Emergency", chronicConditions: "Diabetes, Obesity", allergies: "None", currentMedications: "Nitroprusside drip, Labetalol", patientType: "human", address: "666 Chestnut Dr, New York, NY" },

  // Human patients - Neurology
  { name: "Nancy Hayes", phone: "+12025551214", email: "nhayes@email.com", language: "en", primaryDiagnosis: "Parkinson's Disease", chronicConditions: "Essential tremor, Depression", allergies: "Haloperidol", currentMedications: "Carbidopa/Levodopa 25/100, Pramipexole 0.5mg", patientType: "human", address: "123 River Rd, New York, NY" },
  { name: "Steven King", phone: "+12025551215", email: "sking@email.com", language: "en", primaryDiagnosis: "Epilepsy", chronicConditions: "Anxiety", allergies: "Carbamazepine", currentMedications: "Levetiracetam 1000mg BID, Lamotrigine 200mg", patientType: "human", address: "456 Lake Dr, New York, NY" },
  { name: "Sandra Foster", phone: "+12025551216", email: "sfoster@email.com", language: "en", primaryDiagnosis: "Multiple Sclerosis", chronicConditions: "Fatigue, Spasticity", allergies: "Interferon", currentMedications: "Ocrelizumab, Baclofen 10mg, Modafinil 100mg", patientType: "human", address: "789 Mountain Ave, New York, NY" },

  // Human patients - Dental
  { name: "Diane Foster", phone: "+12025551221", email: "dfoster@email.com", language: "en", primaryDiagnosis: "Periodontitis Stage III", chronicConditions: "Diabetes", allergies: "Penicillin", currentMedications: "Metformin, Chlorhexidine mouthwash", patientType: "human", address: "111 Dental Ave, New York, NY" },
  { name: "George Nelson", phone: "+12025551222", email: "gnelson@email.com", language: "en", primaryDiagnosis: "Impacted Wisdom Teeth", chronicConditions: "None", allergies: "Codeine", currentMedications: "Ibuprofen PRN", patientType: "human", address: "222 Molar St, New York, NY" },
  { name: "Rebecca Baker", phone: "+12025551223", email: "rbaker@email.com", language: "en", primaryDiagnosis: "Bruxism", chronicConditions: "TMJ disorder, Anxiety", allergies: "Latex", currentMedications: "Night guard, Sertraline 50mg", patientType: "human", address: "333 Gum Rd, New York, NY" },
  { name: "Richard Cox", phone: "+12025551224", email: "rcox@email.com", language: "en", primaryDiagnosis: "Root Canal Infection", chronicConditions: "None", allergies: "Sulfa", currentMedications: "Amoxicillin 500mg, Ibuprofen 600mg", patientType: "human", address: "444 Enamel Way, New York, NY" },
  { name: "Martha Cook", phone: "+12025551225", email: "mcook@email.com", language: "en", primaryDiagnosis: "Gingivitis", chronicConditions: "Pregnancy", allergies: "None", currentMedications: "Prenatal vitamins", patientType: "human", address: "555 Crown Ct, New York, NY" },

  // Human patients - Emergency flags
  { name: "Frank Wood", phone: "+12025551217", email: "fwood@email.com", language: "en", primaryDiagnosis: "Chest Pain - Rule Out MI", chronicConditions: "CAD, Hypertension, Hyperlipidemia", allergies: "Aspirin", currentMedications: "Atorvastatin 40mg, Amlodipine 5mg", patientType: "human", address: "101 Emergency Ln, New York, NY" },
  { name: "Virginia Morgan", phone: "+12025551218", email: "vmorgan@email.com", language: "en", primaryDiagnosis: "Stroke Symptoms", chronicConditions: "Hypertension, AFib, Diabetes", allergies: "Warfarin", currentMedications: "Apixaban, Metformin, Losartan", patientType: "human", address: "202 Critical Ave, New York, NY" },
  { name: "Joseph Ward", phone: "+12025551219", email: "jward@email.com", language: "en", primaryDiagnosis: "Anaphylaxis", chronicConditions: "Food allergies, Asthma", allergies: "Peanuts, Shellfish", currentMedications: "EpiPen, Albuterol, Cetirizine", patientType: "human", address: "303 Urgent Rd, New York, NY" },

  // Vet patients
  { name: "Buddy", phone: "+12025551230", email: "buddyowner@email.com", language: "en", primaryDiagnosis: "Hip Dysplasia", chronicConditions: "Arthritis, Obesity", allergies: "None", currentMedications: "Carprofen 100mg, Glucosamine", patientType: "pet", species: "Dog", breed: "Golden Retriever", weight: "75", ownerName: "John Parker", ownerPhone: "+12025551230" },
  { name: "Luna", phone: "+12025551231", email: "lunaowner@email.com", language: "en", primaryDiagnosis: "Chronic Kidney Disease", chronicConditions: "Hyperthyroidism", allergies: "None", currentMedications: "Methimazole 2.5mg, Sub-Q fluids", patientType: "pet", species: "Cat", breed: "Domestic Shorthair", weight: "9", ownerName: "Lisa Moon", ownerPhone: "+12025551231" },
  { name: "Shadow", phone: "+12025551232", email: "shadowowner@email.com", language: "en", primaryDiagnosis: "Laminitis", chronicConditions: "Cushing's Disease", allergies: "Penicillin", currentMedications: "Trilostane, Bute paste, Tylose powder", patientType: "pet", species: "Horse", breed: "Arabian Gelding", weight: "950", ownerName: "Sarah Equestrian", ownerPhone: "+12025551232" },
  { name: "Mittens", phone: "+12025551233", email: "mittensowner@email.com", language: "en", primaryDiagnosis: "Diabetes Mellitus", chronicConditions: "Feline Leukemia", allergies: "None", currentMedications: "Lantus insulin 2U BID, Hill's MD", patientType: "pet", species: "Cat", breed: "Domestic Cat", weight: "12", ownerName: "Tom Kitten", ownerPhone: "+12025551233" },
  { name: "Daisy", phone: "+12025551234", email: "daisyowner@email.com", language: "en", primaryDiagnosis: "Mastitis", chronicConditions: "None", allergies: "Ceftiofur", currentMedications: "Penicillin G, Flunixin", patientType: "pet", species: "Cow", breed: "Holstein Cow", weight: "1400", ownerName: "Farmer Johnson", ownerPhone: "+12025551234" },
  { name: "Dolly", phone: "+12025551235", email: "dollyowner@email.com", language: "en", primaryDiagnosis: "Pneumonia", chronicConditions: "None", allergies: "None", currentMedications: "Oxytetracycline, Banamine", patientType: "pet", species: "Goat", breed: "Pygmy Goat", weight: "55", ownerName: "Betty Herder", ownerPhone: "+12025551235" },
  { name: "Woolly", phone: "+12025551236", email: "woollyowner@email.com", language: "en", primaryDiagnosis: "Foot Rot", chronicConditions: "Parasites", allergies: "None", currentMedications: "Lincocin, Ivermectin drench", patientType: "pet", species: "Sheep", breed: "Sheep", weight: "160", ownerName: "Shepherd Mike", ownerPhone: "+12025551236" },
  { name: "Apollo", phone: "+12025551237", email: "apolloowner@email.com", language: "en", primaryDiagnosis: "Dental Disease Grade 3", chronicConditions: "Heart murmur", allergies: "None", currentMedications: "Clindamycin, Meloxicam PRN", patientType: "pet", species: "Dog", breed: "Miniature Poodle", weight: "18", ownerName: "Grace Petlove", ownerPhone: "+12025551237" },
  { name: "Hoppy", phone: "+12025551238", email: "hoppyowner@email.com", language: "en", primaryDiagnosis: "GI Stasis", chronicConditions: "Malocclusion", allergies: "Enrofloxacin", currentMedications: "Simethicone, Critical Care, Meloxicam", patientType: "pet", species: "Rabbit", breed: "Flemish Giant Rabbit", weight: "14", ownerName: "Alice Bunnyhop", ownerPhone: "+12025551238" },
  { name: "Fluffy", phone: "+12025551239", email: "fluffyowner@email.com", language: "en", primaryDiagnosis: "Respiratory Infection", chronicConditions: "None", allergies: "None", currentMedications: "Doxycycline, Nebulization PRN", patientType: "pet", species: "Cat", breed: "Persian Cat", weight: "11", ownerName: "Nancy Flufftail", ownerPhone: "+12025551239" },
];

for (var i = 0; i < patientData.length; i++) {
  var p = patientData[i];
  var patientId = ObjectId();
  var doc = {
    _id: patientId,
    organization: orgId,
    name: p.name,
    phone: p.phone,
    email: p.email || "",
    language: p.language || "en",
    primaryDiagnosis: p.primaryDiagnosis,
    chronicConditions: p.chronicConditions || "",
    allergies: p.allergies || "",
    currentMedications: p.currentMedications || "",
    patientType: p.patientType || "human",
    address: p.address || "",
    createdAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 86400000),
    updatedAt: new Date()
  };
  if (p.patientType === "pet") {
    doc.species = p.species;
    doc.breed = p.breed;
    doc.weight = p.weight;
    doc.ownerName = p.ownerName;
    doc.ownerPhone = p.ownerPhone;
  }
  // Add call instructions to some patients
  if (i % 5 === 0) {
    var templates = ["General Checkup", "Diabetes Follow-up", "Hypertension Monitoring", "Post-Op Check", "Vaccination Reminder", "Dental Cleaning", "Annual Wellness", "Medication Review"];
    doc.callInstructions = {
      templateId: "tpl_" + (i % 8),
      templateName: templates[i % 8],
      notes: "Patient prefers afternoon calls. Speak slowly and clearly.",
      setBy: ObjectId("6a554f5f68ed3185349a78c2"),
      setAt: new Date(),
      expiresAt: new Date(Date.now() + (i % 3 === 0 ? 2 : 24) * 3600000)
    };
  }
  db.patients.insertOne(doc);
  patients.push({ _id: patientId, name: p.name, phone: p.phone, primaryDiagnosis: p.primaryDiagnosis });
}

print("Seeded " + patients.length + " patients");

// ========== GROUPS ==========
var groupData = [
  { name: "Diabetes Management", description: "Patients with Type 1 and Type 2 diabetes requiring regular monitoring", diagnosisFilter: "Diabetes" },
  { name: "Cardiology Follow-up", description: "Cardiac patients needing quarterly checkups", diagnosisFilter: "Cardiac" },
  { name: "Dental Recall Q3", description: "Patients due for dental cleaning in Q3", diagnosisFilter: "Dental" },
  { name: "Vaccination Drive", description: "Patients needing annual flu shots and boosters", diagnosisFilter: "Vaccine" },
  { name: "Pet Wellness Program", description: "Pet patients on annual wellness plans", diagnosisFilter: "Pet" },
];

for (var i = 0; i < groupData.length; i++) {
  var g = groupData[i];
  var memberIds = [];
  // Assign first 5-8 patients to each group
  for (var j = i * 7; j < Math.min(i * 7 + 8, patients.length); j++) {
    memberIds.push({ _id: patients[j]._id, name: patients[j].name });
  }
  db.groups.insertOne({
    _id: ObjectId(),
    organization: orgId,
    name: g.name,
    description: g.description,
    diagnosisFilter: g.diagnosisFilter,
    members: memberIds.map(function(m) { return { _id: m._id, name: m.name }; }),
    createdAt: new Date(),
    updatedAt: new Date()
  });
}
print("Seeded " + groupData.length + " groups");

// ========== ROOMS ==========
var roomData = [
  { name: "Exam Room 1", number: "101", type: "exam", floor: 1, wing: "East", capacity: 1, equipment: "Exam table, BP monitor, Pulse ox, Otoscope", status: "available" },
  { name: "Exam Room 2", number: "102", type: "exam", floor: 1, wing: "East", capacity: 1, equipment: "Exam table, ECG machine, Defibrillator", status: "available" },
  { name: "Consultation Room", number: "201", type: "consultation", floor: 2, wing: "West", capacity: 4, equipment: "Desk, computer, conference phone", status: "available" },
  { name: "Procedure Room", number: "103", type: "procedure", floor: 1, wing: "East", capacity: 3, equipment: "Surgical table, Anesthesia machine, Sterilizer, Suction", status: "available" },
  { name: "Treatment Room", number: "104", type: "treatment", floor: 1, wing: "West", capacity: 2, equipment: "Treatment chairs, IV poles, Wound care supplies", status: "available" },
  { name: "Telehealth Station", number: "301", type: "telehealth", floor: 3, wing: "North", capacity: 1, equipment: "Webcam, monitor, lighting, noise-cancelling mic", status: "available" },
];
for (var i = 0; i < roomData.length; i++) {
  var r = roomData[i];
  db.rooms.insertOne({
    _id: ObjectId(),
    organization: orgId,
    name: r.name,
    number: r.number,
    type: r.type,
    floor: r.floor,
    wing: r.wing,
    capacity: r.capacity,
    equipment: r.equipment,
    status: r.status,
    createdAt: new Date(),
    updatedAt: new Date()
  });
}
print("Seeded " + roomData.length + " rooms");

// ========== CALLS (30+) ==========
var callScripts = [
  { severity: 2, status: "completed", emergency: false, summary: "Routine checkup. Patient feeling well. Blood pressure 128/82. Medications refilled for 3 months.", redFlags: [] },
  { severity: 4, status: "completed", emergency: false, summary: "Follow-up on diabetes. HbA1c improved to 7.1. Patient reports better dietary compliance. Continue current regimen.", redFlags: [] },
  { severity: 6, status: "completed", emergency: false, summary: "Patient reports intermittent chest pain when climbing stairs. Pain rated 5/10, subsides with rest. Advised to schedule cardiology follow-up.", redFlags: [{ keyword: "chest pain", tier: 1 }] },
  { severity: 8, status: "completed", emergency: false, summary: "Severe headache with visual changes. BP 180/110. Patient advised to go to ER immediately. Escalated to supervising physician.", redFlags: [{ keyword: "severe headache", tier: 0 }, { keyword: "visual changes", tier: 0 }, { keyword: "hypertensive crisis", tier: 0 }] },
  { severity: 9, status: "completed", emergency: true, summary: "Patient reports sudden onset chest tightness radiating to left arm. Shortness of breath. 911 called. Patient transported to ER.", redFlags: [{ keyword: "chest tightness", tier: 0 }, { keyword: "radiating pain", tier: 0 }, { keyword: "shortness of breath", tier: 0 }], emergencyDetected: true, emergencyActionTaken: "called_911" },
  { severity: 3, status: "completed", emergency: false, summary: "Dental checkup follow-up. Healing well after extraction. No signs of infection. Prescribed chlorhexidine mouthwash.", redFlags: [] },
  { severity: 5, status: "completed", emergency: false, summary: "Rash on forearms for 2 weeks. Looks like contact dermatitis. Advised OTC hydrocortisone and to avoid triggers.", redFlags: [] },
  { severity: 7, status: "completed", emergency: false, summary: "Patient with COPD reports increased shortness of breath and green sputum. Possible exacerbation. Prescribed antibiotics and prednisone burst.", redFlags: [{ keyword: "shortness of breath", tier: 1 }, { keyword: "green sputum", tier: 1 }] },
  { severity: 1, status: "completed", emergency: false, summary: "Wellness check. All vitals normal. Patient has no concerns. Next appointment scheduled in 6 months.", redFlags: [] },
  { severity: 10, status: "completed", emergency: true, summary: "Patient found unresponsive via call. 911 dispatched immediately. AI detected fall keywords. Emergency services en route.", redFlags: [{ keyword: "unresponsive", tier: 0 }, { keyword: "not breathing", tier: 0 }, { keyword: "fall detected", tier: 0 }], emergencyDetected: true, emergencyActionTaken: "called_911" },
  { severity: 2, status: "completed", emergency: false, summary: "Pet wellness check. Buddy the Golden Retriever is active and healthy. Vaccinations up to date. Heartworm test negative.", redFlags: [] },
  { severity: 7, status: "completed", emergency: false, summary: "Cat with CKD. BUN and creatinine elevated. Adjusting fluid therapy. Owner educated on subcutaneous fluids administration.", redFlags: [] },
  { severity: 5, status: "completed", emergency: false, summary: "Horse lameness evaluation. Grade 3/5 lameness right forelimb. Likely hoof abscess. Farrier recommended.", redFlags: [] },
  { severity: 8, status: "completed", emergency: true, summary: "Pigmy goat with severe respiratory distress. Crackles on auscultation. Emergency treatment initiated. Referred to veterinary hospital.", redFlags: [{ keyword: "respiratory distress", tier: 0 }, { keyword: "crackles", tier: 1 }], emergencyDetected: true, emergencyActionTaken: "called_clinic" },
  { severity: 6, status: "completed", emergency: false, summary: "Cow mastitis follow-up. Milk quality improving. Continue antibiotic therapy for 3 more days. Good response to treatment.", redFlags: [] },
  { severity: 3, status: "scheduled", emergency: false, summary: "", redFlags: [] },
  { severity: 0, status: "scheduled", emergency: false, summary: "", redFlags: [] },
  { severity: 4, status: "scheduled", emergency: false, summary: "", redFlags: [] },
  { severity: 7, status: "in-progress", emergency: false, summary: "Call in progress. Patient discussing recent lab results.", redFlags: [] },
  { severity: 5, status: "in-progress", emergency: false, summary: "Call in progress. Medication review.", redFlags: [] },
  { severity: 9, status: "in-progress", emergency: true, summary: "Active emergency call. Patient reports suicidal ideation. Crisis protocol activated. Supervisor notified.", redFlags: [{ keyword: "suicidal", tier: 0 }, { keyword: "self-harm", tier: 0 }], emergencyDetected: true, emergencyActionTaken: "none" },
  { severity: 0, status: "failed", emergency: false, summary: "Call failed - no answer. Voicemail left.", redFlags: [] },
  { severity: 0, status: "failed", emergency: false, summary: "Call failed - wrong number. Updating contact info.", redFlags: [] },
  { severity: 0, status: "failed", emergency: false, summary: "Call failed - line disconnected. Attempting alternate number.", redFlags: [] },
  { severity: 8, status: "completed", emergency: true, summary: "Patient with known CAD reports substernal chest pain lasting 15 minutes. Took nitroglycerin with partial relief. 911 called. Hospital alerted.", redFlags: [{ keyword: "substernal chest pain", tier: 0 }, { keyword: "nitroglycerin", tier: 1 }], emergencyDetected: true, emergencyActionTaken: "called_911" },
  { severity: 3, status: "completed", emergency: false, summary: "Post-operative check. Surgical site healing well. No signs of infection. Pain controlled with oral analgesics.", redFlags: [] },
  { severity: 7, status: "completed", emergency: false, summary: "Dental patient with swelling and pain. Possible abscess. Prescribed antibiotics. Scheduled for emergency extraction.", redFlags: [{ keyword: "swelling", tier: 1 }, { keyword: "abscess", tier: 1 }] },
  { severity: 2, status: "completed", emergency: false, summary: "Rabbit GI stasis follow-up. Eating and pooping normally again. Continue critical care feeding for 2 more days.", redFlags: [] },
  { severity: 6, status: "completed", emergency: false, summary: "Patient with MDD reports worsening depression. Medication dose adjusted. Referred to therapist. Safety plan reviewed.", redFlags: [{ keyword: "worsening depression", tier: 1 }] },
  { severity: 4, status: "completed", emergency: false, summary: "Thyroid follow-up. TSH 3.2. Levothyroxine dose stable. Patient feeling well. Repeat labs in 3 months.", redFlags: [] },
  { severity: 9, status: "completed", emergency: true, summary: "Anaphylaxis alert! Patient accidentally ingested peanuts. Difficulty breathing, hives, swelling. EpiPen administered. 911 dispatched.", redFlags: [{ keyword: "anaphylaxis", tier: 0 }, { keyword: "difficulty breathing", tier: 0 }, { keyword: "hives", tier: 0 }, { keyword: "swelling", tier: 0 }], emergencyDetected: true, emergencyActionTaken: "called_911" },
];

var callIds = [];
for (var i = 0; i < callScripts.length; i++) {
  var cs = callScripts[i];
  var patientIdx = i % patients.length;
  // Use a patient with phone for in-progress/scheduled calls
  var callPatient = patients[patientIdx];
  var callId = ObjectId();
  callIds.push(callId);

  var now = new Date();
  var callCreatedAt;
  if (cs.status === "scheduled") {
    callCreatedAt = new Date(now.getTime() + (i * 2 + 1) * 3600000); // future
  } else {
    callCreatedAt = new Date(now.getTime() - (callScripts.length - i) * 3600000); // past
  }

  var callDoc = {
    _id: callId,
    organization: orgId,
    patient: { _id: callPatient._id, name: callPatient.name, phone: callPatient.phone },
    status: cs.status,
    aiSeverityScore: cs.severity,
    aiSummary: cs.summary,
    createdAt: callCreatedAt,
    updatedAt: new Date(),
    redFlags: cs.redFlags,
    scheduledAt: cs.status === "scheduled" ? new Date(now.getTime() + (i * 2 + 1) * 3600000) : undefined,
    emergencyActionTaken: cs.emergencyActionTaken || "none"
  };
  if (cs.emergencyDetected) callDoc.emergencyDetected = true;
  db.calls.insertOne(callDoc);
}
print("Seeded " + callScripts.length + " calls");

// ========== QA SCORES ==========
var completedCalls = db.calls.find({ organization: orgId, status: "completed" }).toArray();
var qaCount = 0;
for (var i = 0; i < Math.min(completedCalls.length, 15); i++) {
  var call = completedCalls[i];
  var baseScore = Math.min(Math.max(call.aiSeverityScore * 10 + Math.floor(Math.random() * 20), 40), 98);
  db["qa-scores"].insertOne({
    _id: ObjectId(),
    organization: orgId,
    callId: call._id,
    patientId: call.patient._id,
    patientName: call.patient.name,
    scores: {
      accuracy: baseScore + Math.floor(Math.random() * 10),
      empathy: baseScore - 5 + Math.floor(Math.random() * 15),
      compliance: baseScore + Math.floor(Math.random() * 8),
      communication: baseScore + Math.floor(Math.random() * 12),
      overall: baseScore + Math.floor(Math.random() * 8)
    },
    feedback: i % 3 === 0 ? "Agent handled the call professionally. Good bedside manner." : (i % 3 === 1 ? "Needs improvement in gathering complete patient history." : "Excellent clinical assessment and escalation."),
    reviewer: ObjectId("6a554f5f68ed3185349a78c2"),
    createdAt: call.createdAt,
    updatedAt: new Date()
  });
  qaCount++;
}
print("Seeded " + qaCount + " QA scores");

// ========== APPOINTMENTS ==========
var appointmentStatuses = ["confirmed", "completed", "cancelled", "no-show"];
var appointmentTypes = ["checkup", "follow-up", "consultation", "procedure", "telehealth"];
var now = new Date();
for (var i = 0; i < 20; i++) {
  var patientIdx = i % patients.length;
  var aptPatient = patients[patientIdx];
  var status = i < 5 ? "confirmed" : (i < 10 ? "completed" : (i < 15 ? "cancelled" : "no-show"));
  var isPast = status !== "confirmed";
  var aptDate = isPast ? new Date(now.getTime() - (i + 1) * 86400000) : new Date(now.getTime() + (i - 4) * 86400000);

  db.appointments.insertOne({
    _id: ObjectId(),
    organization: orgId,
    patient: { _id: aptPatient._id, name: aptPatient.name, phone: aptPatient.phone },
    type: appointmentTypes[i % appointmentTypes.length],
    status: status,
    date: aptDate,
    startTime: aptDate.toISOString(),
    endTime: new Date(aptDate.getTime() + 30 * 60000).toISOString(),
    notes: i % 4 === 0 ? "Patient requested morning appointment" : (i % 4 === 1 ? "Follow-up required" : ""),
    createdBy: ObjectId("6a554f5f68ed3185349a78c2"),
    createdAt: new Date(now.getTime() - 7 * 86400000),
    updatedAt: new Date()
  });
}
print("Seeded 20 appointments");

// ========== KNOWLEDGE BASE ==========
var kbDocs = [
  { title: "Clinic After-Hours Policy", content: "For after-hours emergencies, patients should call 911 or proceed to the nearest ER. Our on-call provider can be reached at (212) 555-0199 for urgent but non-emergency issues between 6PM and 8AM weekdays, and 24 hours on weekends. Routine prescription refills should be requested during business hours." },
  { title: "Common Medication Formulary", content: "First-line hypertension: Lisinopril 10-40mg daily. First-line diabetes: Metformin 500-2000mg daily. First-line hyperlipidemia: Atorvastatin 10-80mg daily. Warfarin monitoring: INR goal 2-3 for most indications. Pediatric dosing: weight-based per AAP guidelines. Always check for drug interactions and allergies." },
  { title: "Vaccination Schedule", content: "Annual flu shot recommended for all patients 6 months+. COVID-19 bivalent booster recommended annually for 5+. Tdap booster every 10 years. Shingrix for adults 50+ in 2 doses. PCV20 for adults 65+ or immunocompromised. RSV vaccine for adults 60+ and pregnant patients." },
  { title: "Referral Process", content: "To refer a patient to a specialist: 1) Complete referral form in EHR 2) Fax supporting records to specialist 3) Follow up within 2 weeks 4) Schedule appointment coordination through front desk. Urgent referrals (suspected cancer, acute cardiac): same-day processing required." },
  { title: "AI Voice Agent Guidelines", content: "The AI voice agent is designed for: routine checkups, medication refills, appointment reminders, post-op follow-ups, and lab result notifications. The AI must NOT: diagnose new conditions, change medications, or provide emergency advice. Always transfer to human provider for: chest pain, shortness of breath, suicidal ideation, severe allergic reactions, or stroke symptoms." },
  { title: "Pet Wellness Program Details", content: "Our veterinary wellness program includes: annual physical exam, core vaccinations (rabies, DHPP for dogs, FVRCP for cats), heartworm testing, fecal exam, and dental assessment. Senior pets (7+ years) receive additional bloodwork and urinalysis. Microchipping available upon request." },
];

for (var i = 0; i < kbDocs.length; i++) {
  var k = kbDocs[i];
  db.knowledgedocs.insertOne({
    _id: ObjectId(),
    organization: orgId,
    title: k.title,
    content: k.content,
    category: "clinic-policy",
    createdAt: new Date(),
    updatedAt: new Date()
  });
}
print("Seeded " + kbDocs.length + " knowledge base documents");

// ========== NOTIFICATIONS ==========
var types = ["call_reminder", "appointment_reminder", "lab_result", "emergency_alert", "system"];
for (var i = 0; i < 10; i++) {
  var notifType = types[i % types.length];
  var messages = {
    call_reminder: "Scheduled call with " + patients[i % patients.length].name + " in 30 minutes",
    appointment_reminder: "Appointment with " + patients[(i + 1) % patients.length].name + " tomorrow at 10:00 AM",
    lab_result: "Lab results available for " + patients[(i + 2) % patients.length].name,
    emergency_alert: "EMERGENCY: Patient " + patients[(i + 3) % patients.length].name + " requires immediate attention",
    system: "System maintenance scheduled for Sunday 2:00 AM"
  };
  db.notifications.insertOne({
    _id: ObjectId(),
    organization: orgId,
    userId: ObjectId("6a554f5f68ed3185349a78c2"),
    type: notifType,
    title: notifType.replace(/_/g, " ").replace(/\b\w/g, function(l) { return l.toUpperCase(); }),
    message: messages[notifType],
    read: i >= 6,
    link: notifType === "emergency_alert" ? "/dashboard" : "/calls/" + callIds[i % callIds.length],
    createdAt: new Date(now.getTime() - i * 3600000),
    updatedAt: new Date()
  });
}
print("Seeded 10 notifications");

print("\n=== SEEDING COMPLETE ===");
print("Patients: " + patients.length);
print("Groups: " + groupData.length);
print("Rooms: " + roomData.length);
print("Calls: " + callScripts.length);
print("QA Scores: " + qaCount);
print("Appointments: 20");
print("Knowledge Base: " + kbDocs.length);
print("Notifications: 10");
