import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/oriveo";

const patientSchema = new mongoose.Schema({}, { strict: false, timestamps: true });
const userSchema = new mongoose.Schema({}, { strict: false, timestamps: true });
const orgSchema = new mongoose.Schema({}, { strict: false, timestamps: true });
const callSchema = new mongoose.Schema({}, { strict: false, timestamps: true });
const appointmentSchema = new mongoose.Schema({}, { strict: false, timestamps: true });
const groupSchema = new mongoose.Schema({}, { strict: false, timestamps: true });
const reportSchema = new mongoose.Schema({}, { strict: false, timestamps: true });
const subSchema = new mongoose.Schema({}, { strict: false, timestamps: true });
const medicalRecordSchema = new mongoose.Schema({}, { strict: false, timestamps: true });
const patientDocSchema = new mongoose.Schema({}, { strict: false, timestamps: true });
const vitalSchema = new mongoose.Schema({}, { strict: false, timestamps: true });

const Patient = mongoose.model("Patient", patientSchema);
const User = mongoose.model("User", userSchema);
const Organization = mongoose.model("Organization", orgSchema);
const Call = mongoose.model("Call", callSchema);
const Appointment = mongoose.model("Appointment", appointmentSchema);
const Group = mongoose.model("Group", groupSchema);
const Report = mongoose.model("Report", reportSchema);
const Subscription = mongoose.model("Subscription", subSchema);
const MedicalRecord = mongoose.model("MedicalRecord", medicalRecordSchema);
const PatientDocument = mongoose.model("PatientDocument", patientDocSchema);
const VitalSign = mongoose.model("VitalSign", vitalSchema);

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB");

  // 1. Organization
  let org = await Organization.findOne({ slug: "demo-clinic" });
  if (!org) {
    org = await Organization.create({ name: "Demo Clinic", slug: "demo-clinic", type: "human", isActive: true });
    console.log("Created org:", org._id);
  } else {
    console.log("Org exists:", org._id);
  }

  // 2. Subscription
  const sub = await Subscription.findOne({ organization: org._id });
  if (!sub) {
    await Subscription.create({
      organization: org._id,
      plan: "pro",
      status: "active",
      startDate: new Date("2025-01-01"),
      limits: { maxUsers: 50, maxPatients: 5000, maxMonthlyCalls: 10000 },
    });
    console.log("Created subscription");
  }

  // 3. Users
  const usersData = [
    { name: "Dr. Anas Samiri", email: "anassamiri87@gmail.com", password: "demo123", role: "admin", phone: "+212600000001", specialty: ["General Medicine"], language: "fr" },
    { name: "Dr. Sarah Johnson", email: "sarah@demo-clinic.com", password: "demo123", role: "doctor", phone: "+212600000002", specialty: ["Cardiology"], language: "en" },
    { name: "Dr. Karim Bennani", email: "karim@demo-clinic.com", password: "demo123", role: "doctor", phone: "+212600000003", specialty: ["Dentistry"], language: "fr" },
    { name: "Nurse Fatima Zahra", email: "fatima@demo-clinic.com", password: "demo123", role: "nurse", phone: "+212600000004", language: "fr" },
    { name: "Receptionist Ahmed", email: "ahmed@demo-clinic.com", password: "demo123", role: "receptionist", phone: "+212600000005", language: "fr" },
  ];

  const users = [];
  for (const u of usersData) {
    let existing = await User.findOne({ email: u.email });
    if (!existing) {
      const hashed = await bcrypt.hash(u.password, 12);
      existing = await User.create({ ...u, password: hashed, organization: org._id, isActive: true, tokenVersion: 0, superAdmin: u.email === "anassamiri87@gmail.com" });
      console.log("Created user:", u.email);
    }
    users.push(existing);
  }

  const docSarah = users.find(u => u.email === "sarah@demo-clinic.com");
  const docKarim = users.find(u => u.email === "karim@demo-clinic.com");
  const nurseFatima = users.find(u => u.email === "fatima@demo-clinic.com");
  const adminUser = users.find(u => u.email === "anassamiri87@gmail.com");

  // 4. Patients
  const patientsData = [
    { name: "Youssef El Amrani", patientType: "human", phone: "+212600000010", email: "youssef@email.com", dob: new Date("1985-03-15"), gender: "male", bloodType: "A+", language: "fr", address: "12 Rue de la Liberté, Casablanca", primaryDiagnosis: "Type 2 Diabetes", chronicConditions: "Hypertension, High Cholesterol", allergies: "Penicillin", currentMedications: "Metformin 500mg, Lisinopril 10mg", pastSurgeries: "Appendectomy (2018)", emergencyContact: "Samira El Amrani", emergencyContactPhone: "+212600000011", insuranceId: "INS-001", assignedDoctor: docSarah._id, medicalNotes: "Patient prefers morning consultations. Family history of diabetes." },
    { name: "Amina Benali", patientType: "human", phone: "+212600000012", email: "amina@email.com", dob: new Date("1990-07-22"), gender: "female", bloodType: "O-", language: "fr", address: "45 Avenue Hassan II, Rabat", primaryDiagnosis: "Asthma", chronicConditions: "Seasonal Allergies", allergies: "Aspirin, Sulfa", currentMedications: "Albuterol inhaler PRN", pastSurgeries: "None", emergencyContact: "Hassan Benali", emergencyContactPhone: "+212600000013", insuranceId: "INS-002", assignedDoctor: docSarah._id },
    { name: "Mohamed Idrissi", patientType: "human", phone: "+212600000014", email: "mohamed@email.com", dob: new Date("1972-11-08"), gender: "male", bloodType: "B+", language: "fr", address: "8 Rue de Fès, Marrakech", primaryDiagnosis: "Coronary Artery Disease", chronicConditions: "Diabetes Type 2, Hypertension", allergies: "None", currentMedications: "Aspirin 81mg, Atorvastatin 20mg, Metformin 1000mg", pastSurgeries: "Coronary Stent (2021)", emergencyContact: "Khadija Idrissi", emergencyContactPhone: "+212600000015", insuranceId: "INS-003", assignedDoctor: docSarah._id, medicalNotes: "Post-stent patient. Needs regular ECG monitoring." },
    { name: "Leila Ouazzani", patientType: "human", phone: "+212600000016", email: "leila@email.com", dob: new Date("2000-01-30"), gender: "female", bloodType: "AB+", language: "fr", address: "23 Rue Mohammed V, Tanger", primaryDiagnosis: "Dental Caries", chronicConditions: "None", allergies: "Latex", currentMedications: "None", pastSurgeries: "Wisdom teeth extraction (2022)", emergencyContact: "Omar Ouazzani", emergencyContactPhone: "+212600000017", insuranceId: "INS-004", assignedDoctor: docKarim._id, medicalNotes: "Needs routine dental checkup every 6 months." },
    { name: "Hassan Tazi", patientType: "human", phone: "+212600000018", email: "hassan@email.com", dob: new Date("1965-09-12"), gender: "male", bloodType: "A-", language: "fr", address: "7 Rue Oujda, Fès", primaryDiagnosis: "Chronic Lower Back Pain", chronicConditions: "Arthritis", allergies: "Codeine", currentMedications: "Ibuprofen 400mg PRN", pastSurgeries: "Herniated Disc Surgery (2019)", emergencyContact: "Fatima Tazi", emergencyContactPhone: "+212600000019", insuranceId: "INS-005", assignedDoctor: docKarim._id },
    { name: "Rex", patientType: "pet", phone: "+212600000020", species: "Dog", breed: "Golden Retriever", weight: 32, color: "Golden", microchipId: "MC-001", gender: "intact-male", language: "en", ownerName: "Pierre Dubois", ownerPhone: "+212600000021", ownerEmail: "pierre@email.com", primaryDiagnosis: "None", chronicConditions: "None", allergies: "Chicken", currentMedications: "Heartworm prevention monthly", pastSurgeries: "None", assignedDoctor: docSarah._id },
    { name: "Mimi", patientType: "pet", phone: "+212600000022", species: "Cat", breed: "Persian", weight: 4.5, color: "White", microchipId: "MC-002", gender: "intact-female", language: "fr", ownerName: "Nadia El Fassi", ownerPhone: "+212600000023", ownerEmail: "nadia@email.com", primaryDiagnosis: "None", chronicConditions: "None", allergies: "None", currentMedications: "None", pastSurgeries: "Spayed (2023)", assignedDoctor: docSarah._id },
  ];

  const patients = [];
  for (const p of patientsData) {
    let existing = await Patient.findOne({ name: p.name, organization: org._id });
    if (!existing) {
      existing = await Patient.create({ ...p, organization: org._id, createdBy: adminUser._id, isActive: true, lastCheckupDate: new Date("2026-06-01") });
      console.log("Created patient:", p.name);
    }
    patients.push(existing);
  }

  // 5. Medical Records
  const recordsData = [
    { patient: patients[0]._id, type: "diagnosis", title: "Type 2 Diabetes Diagnosed", description: "HbA1c 7.2%. Started Metformin 500mg twice daily.", date: new Date("2025-03-20"), doctor: docSarah._id },
    { patient: patients[0]._id, type: "diagnosis", title: "Hypertension Diagnosed", description: "BP 145/90. Started Lisinopril 10mg daily.", date: new Date("2025-06-15"), doctor: docSarah._id },
    { patient: patients[0]._id, type: "lab", title: "Annual Blood Panel", description: "HbA1c 6.8% (improved). LDL 110 mg/dL. Creatinine normal.", date: new Date("2026-05-10"), doctor: docSarah._id },
    { patient: patients[2]._id, type: "surgery", title: "Coronary Stent Placement", description: "Single stent placed in LAD artery. Procedure successful. Discharged day 2.", date: new Date("2021-11-08"), doctor: docSarah._id },
    { patient: patients[2]._id, type: "lab", title: "Cardiac Stress Test", description: "Patient exercised 8 min on Bruce protocol. ECG normal. No ischemia detected.", date: new Date("2026-04-22"), doctor: docSarah._id },
    { patient: patients[3]._id, type: "surgery", title: "Wisdom Teeth Extraction", description: "All 4 impacted wisdom teeth extracted under local anesthesia.", date: new Date("2022-09-15"), doctor: docKarim._id },
    { patient: patients[3]._id, type: "diagnosis", title: "Dental Caries - Upper Right Molar", description: "Cavity detected on tooth #16. Composite filling performed.", date: new Date("2026-06-10"), doctor: docKarim._id },
    { patient: patients[4]._id, type: "surgery", title: "Microdiscectomy L4-L5", description: "Herniated disc removed. Patient reported immediate relief of sciatica.", date: new Date("2019-03-22"), doctor: docKarim._id },
    { patient: patients[5]._id, type: "vaccine", title: "Annual Rabies Vaccine", description: "Rabies vaccine administered. Next due June 2027.", date: new Date("2026-06-01"), doctor: docSarah._id },
    { patient: patients[5]._id, type: "lab", title: "Heartworm Test", description: "Negative. Monthly prevention continued.", date: new Date("2026-06-01"), doctor: docSarah._id },
    { patient: patients[6]._id, type: "surgery", title: "Spay Surgery", description: "Ovariohysterectomy performed. Recovery uneventful.", date: new Date("2023-04-10"), doctor: docSarah._id },
  ];

  for (const r of recordsData) {
    const existing = await MedicalRecord.findOne({ title: r.title, patient: r.patient });
    if (!existing) {
      await MedicalRecord.create({ ...r, organization: org._id, createdBy: adminUser._id, isActive: true });
      console.log("Created record:", r.title);
    }
  }

  // 6. Vital Signs
  const vitalsData = [
    { patient: patients[0]._id, bpSystolic: 142, bpDiastolic: 88, heartRate: 76, temperature: 36.8, weight: 85, spo2: 98, notes: "Routine checkup", recordedAt: new Date("2026-06-01T09:00:00") },
    { patient: patients[0]._id, bpSystolic: 138, bpDiastolic: 85, heartRate: 72, temperature: 36.6, weight: 83, spo2: 99, notes: "Follow-up after medication adjustment", recordedAt: new Date("2026-07-01T10:00:00") },
    { patient: patients[0]._id, bpSystolic: 132, bpDiastolic: 82, heartRate: 70, temperature: 36.7, weight: 82, spo2: 98, notes: "Improving", recordedAt: new Date("2026-08-05T11:00:00") },
    { patient: patients[2]._id, bpSystolic: 148, bpDiastolic: 92, heartRate: 80, temperature: 36.5, weight: 92, spo2: 97, notes: "Pre-surgery assessment", recordedAt: new Date("2025-11-01T08:00:00") },
    { patient: patients[5]._id, weight: 32, temperature: 38.2, heartRate: 90, notes: "Annual checkup - healthy", recordedAt: new Date("2026-06-01T14:00:00") },
  ];

  for (const v of vitalsData) {
    const existing = await VitalSign.findOne({ patient: v.patient, recordedAt: v.recordedAt });
    if (!existing) {
      await VitalSign.create({ ...v, organization: org._id, recordedBy: nurseFatima._id });
    }
  }

  // 7. Call history with audio-like structure
  const callsData = [
    {
      patient: patients[0]._id, organization: org._id, status: "completed", direction: "outbound",
      startedAt: new Date("2026-07-10T10:00:00"), endedAt: new Date("2026-07-10T10:12:00"),
      duration: 720, aiSeverityScore: 5,
      aiSummary: "Patient reported feeling well this week. Blood sugar levels stable at 120-140 mg/dL. Reminded to continue Metformin and schedule next HbA1c test. No complaints. Follow-up recommended in 3 months.",
      transcript: [
        { question: "How have you been feeling this week?", answer: "I feel good, much better than last month.", timestamp: new Date("2026-07-10T10:01:00") },
        { question: "Have you been checking your blood sugar regularly?", answer: "Yes, every morning. It's been between 120 and 140.", timestamp: new Date("2026-07-10T10:02:30") },
        { question: "Are you taking your Metformin twice daily?", answer: "Yes, I take it with breakfast and dinner.", timestamp: new Date("2026-07-10T10:04:00") },
        { question: "Any side effects or concerns?", answer: "None at all, doctor.", timestamp: new Date("2026-07-10T10:05:30") },
        { question: "Have you scheduled your next HbA1c test?", answer: "Not yet, I'll do it this week.", timestamp: new Date("2026-07-10T10:07:00") },
      ],
      redFlags: [],
      triageTier: 2, highestTier: 2,
      emotionalState: { primary: "content", intensity: 3, painLevel: 0 },
      qaScore: { overall: 92, accuracy: 95, empathy: 90, professionalism: 94, adherence: 88, resolution: 91, strengths: ["Good rapport", "Clear instructions"], weaknesses: [], summary: "High quality call" },
      createdBy: docSarah._id,
    },
    {
      patient: patients[2]._id, organization: org._id, status: "completed", direction: "outbound",
      startedAt: new Date("2026-07-12T14:00:00"), endedAt: new Date("2026-07-12T14:18:00"),
      duration: 1080, aiSeverityScore: 7,
      aiSummary: "Patient reports intermittent chest pain when climbing stairs. Pain rated 5/10, subsides with rest. Advised to schedule immediate cardiology follow-up. Current medications reviewed. Reminded to take aspirin daily. Escalated to supervising doctor.",
      transcript: [
        { question: "How are you feeling today?", answer: "I've been having some chest pain when I climb stairs.", timestamp: new Date("2026-07-12T14:01:00") },
        { question: "When did this start?", answer: "About a week ago. It goes away when I rest.", timestamp: new Date("2026-07-12T14:02:30") },
        { question: "On a scale of 1 to 10, how bad is the pain?", answer: "About a 5 when it happens.", timestamp: new Date("2026-07-12T14:04:00") },
        { question: "Are you taking your Aspirin daily?", answer: "Yes, every morning like you told me.", timestamp: new Date("2026-07-12T14:06:00") },
        { question: "I'm going to send an urgent message to your doctor. Please come in this week.", answer: "Okay, I'll come tomorrow morning.", timestamp: new Date("2026-07-12T14:08:00") },
      ],
      redFlags: [{ tier: 3, keyword: "chest pain", text: "Chest pain on exertion", crisis: false }],
      triageTier: 3, highestTier: 3,
      emotionalState: { primary: "anxious", intensity: 6, painLevel: 5 },
      qaScore: { overall: 88, accuracy: 90, empathy: 85, professionalism: 92, adherence: 85, resolution: 86, strengths: ["Proper escalation", "Clear urgency"], weaknesses: [], summary: "Good handling of cardiac concern" },
      createdBy: docSarah._id,
    },
    {
      patient: patients[1]._id, organization: org._id, status: "completed", direction: "outbound",
      startedAt: new Date("2026-07-08T09:30:00"), endedAt: new Date("2026-07-08T09:40:00"),
      duration: 600, aiSeverityScore: 3,
      aiSummary: "Annual asthma checkup. Patient reports good control, using inhaler once or twice per week. No recent attacks. Peak flow normal. Refill sent to pharmacy. Follow-up in 6 months.",
      transcript: [
        { question: "How has your asthma been?", answer: "Pretty good, I only use my inhaler maybe once or twice a week.", timestamp: new Date("2026-07-08T09:31:00") },
        { question: "Any asthma attacks in the last month?", answer: "No, not at all.", timestamp: new Date("2026-07-08T09:33:00") },
        { question: "Do you need a refill on your Albuterol?", answer: "Yes, please. I'm almost out.", timestamp: new Date("2026-07-08T09:35:00") },
      ],
      triageTier: 1, highestTier: 1,
      emotionalState: { primary: "calm", intensity: 2, painLevel: 0 },
      qaScore: { overall: 95, accuracy: 96, empathy: 94, professionalism: 96, adherence: 93, resolution: 95, strengths: ["Efficient", "Patient-friendly"], weaknesses: [], summary: "Routine follow-up handled well" },
      createdBy: docSarah._id,
    },
  ];

  for (const c of callsData) {
    const existing = await Call.findOne({ startedAt: c.startedAt, patient: c.patient });
    if (!existing) {
      const call = await Call.create(c);
      console.log("Created call for patient");

      // Create report for each call
      const reportExists = await Report.findOne({ call: call._id });
      if (!reportExists) {
        await Report.create({
          call: call._id, patient: c.patient, organization: org._id,
          patientInfo: { name: "", age: 0, gender: "", phone: "" },
          chiefComplaint: c.transcript?.[0]?.question || "Routine checkup",
          triageLevel: c.triageTier, triageLabel: c.triageTier >= 3 ? "Urgent" : c.triageTier >= 2 ? "Semi-urgent" : "Routine",
          aiSummary: c.aiSummary,
          symptomsCaptured: c.transcript?.slice(0, 3).map((t) => ({ symptom: t.answer, severity: 3 })) || [],
          redFlags: c.redFlags || [],
          keyExchanges: c.transcript?.map((t) => ({ speaker: t.question.includes("?") ? "AI" : "Patient", text: `${t.question} / ${t.answer}` })) || [],
          nextSteps: c.triageTier >= 3 ? ["Urgent cardiology follow-up", "ECG within 24 hours"] : ["Continue current medication", "Follow-up in 3 months"],
          medicationsReviewed: [],
          allergiesFlagged: false,
          callDuration: c.duration,
          callDate: c.startedAt,
          aiQaScores: c.qaScore,
          callSummary: c.aiSummary,
          doctorSigned: true,
          signedBy: c.createdBy,
          signedAt: new Date(),
          signatureTitle: "Attending Physician",
          digitalSignature: "Dr. Anas Samiri",
          createdAt: c.startedAt,
        });
        console.log("Created report for call");
      }
    }
  }

  // 8. Appointments
  const appointmentsData = [
    { patient: patients[0]._id, title: "Diabetes Follow-up", date: new Date("2026-08-15T09:00:00"), duration: 30, type: "in-person", status: "scheduled", reason: "Quarterly HbA1c check" },
    { patient: patients[2]._id, title: "Cardiology Checkup", date: new Date("2026-07-20T14:00:00"), duration: 45, type: "in-person", status: "scheduled", reason: "Chest pain follow-up after call" },
    { patient: patients[3]._id, title: "Dental Cleaning", date: new Date("2026-07-18T10:00:00"), duration: 30, type: "in-person", status: "confirmed", reason: "Routine 6-month cleaning" },
    { patient: patients[5]._id, title: "Vaccination Follow-up", date: new Date("2026-08-01T11:00:00"), duration: 15, type: "in-person", status: "scheduled", reason: "Booster shot" },
  ];

  for (const a of appointmentsData) {
    const existing = await Appointment.findOne({ title: a.title, patient: a.patient, date: a.date });
    if (!existing) {
      await Appointment.create({ ...a, organization: org._id, bookedBy: adminUser._id, reminderSent: false });
      console.log("Created appointment:", a.title);
    }
  }

  // 9. Groups
  const groupsData = [
    { name: "Diabetes Management", description: "Patients with Type 1 and Type 2 diabetes for regular follow-ups" },
    { name: "Cardiac Care", description: "Heart disease patients requiring monitoring" },
    { name: "Dental Patients", description: "Active dental care patients" },
    { name: "Vaccination Queue", description: "Patients due for vaccinations" },
  ];

  const groups = [];
  for (const g of groupsData) {
    let group = await Group.findOne({ name: g.name, organization: org._id });
    if (!group) {
      group = await Group.create({
        name: g.name, description: g.description, organization: org._id,
        members: [patients[0]._id, patients[1]._id, patients[2]._id],
        createdBy: adminUser._id,
      });
      console.log("Created group:", g.name);
    }
    groups.push(group);
  }

  // 10. Documents with OCR text
  const docsData = [
    {
      patient: patients[0]._id, fileName: "lab-cbc-2026-06.pdf", originalName: "Laboratoire_CBC_juin2026.pdf",
      mimeType: "application/pdf", size: 245000, docType: "Lab Result", tags: ["general", "blood", "cbc"],
      ocrText: "LABORATOIRE D'ANALYSES MÉDICALES\nPatient: Youssef El Amrani\nDate: 01/06/2026\nHémoglobine: 14.2 g/dL\nGlucose: 128 mg/dL\nHbA1c: 6.8%\nCholestérol total: 190 mg/dL\nLDL: 110 mg/dL\nHDL: 45 mg/dL\nTriglycérides: 150 mg/dL\nConclusion: Glycémie à surveiller. LDL légèrement élevé.",
    },
    {
      patient: patients[2]._id, fileName: "ecg-2026-04.pdf", originalName: "ECG_Stress_Test_April2026.pdf",
      mimeType: "application/pdf", size: 512000, docType: "ECG Report", tags: ["cardiology", "ecg", "stress test"],
      ocrText: "CARDIOLOGY ASSOCIATES\nPatient: Mohamed Idrissi\nDate: 22/04/2026\nProcedure: Exercise Stress Test\nProtocol: Bruce\nDuration: 8 minutes 12 seconds\nMax HR: 152 bpm (85% predicted)\nBP Response: Normal\nST Segments: No significant depression\nConclusion: Negative for ischemia. Good exercise capacity.",
    },
    {
      patient: patients[3]._id, fileName: "panoramic-2026-06.jpeg", originalName: "Panoramic_Xray_June2026.jpeg",
      mimeType: "image/jpeg", size: 890000, docType: "X-ray", tags: ["dental", "panoramic"],
      ocrText: "DENTAL IMAGING CENTER\nPatient: Leila Ouazzani\nDate: 10/06/2026\nType: Panoramic Radiograph\nFindings: Moderate dental caries noted on tooth #16. Existing composite filling #19 intact. No periapical pathology. Wisdom teeth absent (previously extracted).",
    },
    {
      patient: patients[5]._id, fileName: "vaccine-cert-2026.pdf", originalName: "Rabies_Vaccine_Certificate_2026.pdf",
      mimeType: "application/pdf", size: 120000, docType: "Vaccination Record", tags: ["veterinary", "vaccine"],
      ocrText: "VETERINARY VACCINATION CERTIFICATE\nAnimal: Rex (Golden Retriever)\nVaccine: Rabies (Nobivac Rabies)\nBatch: RAB-2026-0421\nDate: 01/06/2026\nNext due: 01/06/2027\nVeterinarian: Dr. Sarah Johnson\nClinic: Demo Clinic Animal Care",
    },
  ];

  for (const d of docsData) {
    const existing = await PatientDocument.findOne({ fileName: d.fileName, patient: d.patient });
    if (!existing) {
      await PatientDocument.create({ ...d, organization: org._id, ocrProcessed: true, uploadedBy: nurseFatima._id });
      console.log("Created document:", d.originalName);
    }
  }

  // 11. Update user's password to known value for direct login
  const demoPass = await bcrypt.hash("demo123", 12);
  await User.updateOne({ email: "anassamiri87@gmail.com" }, { $set: { password: demoPass, role: "admin", superAdmin: true, tokenVersion: 0 } });
  await User.updateMany({ organization: org._id, email: { $ne: "anassamiri87@gmail.com" } }, { $set: { password: demoPass, tokenVersion: 0 } });
  console.log("All user passwords set to: demo123");

  console.log("\n=== SEED COMPLETE ===");
  console.log("Login: anassamiri87@gmail.com / demo123 (super admin)");
  console.log("Or any demo user / demo123");
  console.log("Patients created:", patients.length);
  console.log("Medical records created:", recordsData.length);
  console.log("Vitals created:", vitalsData.length);
  console.log("Calls created:", callsData.length);
  console.log("Appointments created:", appointmentsData.length);
  console.log("Groups created:", groupsData.length);
  console.log("Documents created:", docsData.length);

  await mongoose.disconnect();
}

seed().catch(e => { console.error("Seed error:", e); process.exit(1); });
