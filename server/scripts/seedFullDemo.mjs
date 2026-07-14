import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const MONGO_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/oriveo";

const PATIENTS = [
  { name: "Ahmed Benali", phone: "+212600111001", email: "ahmed.benali@email.com", gender: "male", dob: new Date("1985-03-15"), language: "en", primaryDiagnosis: "Type 2 Diabetes", chronicConditions: "Hypertension, High cholesterol", allergies: "Penicillin", currentMedications: "Metformin 500mg, Lisinopril 10mg", medicalNotes: "Follow up every 3 months", bloodType: "A+", specialty: "general", patientType: "human" },
  { name: "Fatima Zahra El Amrani", phone: "+212600222002", email: "fatima.elamrani@email.com", gender: "female", dob: new Date("1992-07-22"), language: "fr", primaryDiagnosis: "Asthma", chronicConditions: "Seasonal allergies", allergies: "Sulfa drugs, Pollen", currentMedications: "Albuterol inhaler PRN", medicalNotes: "Uses inhaler 2-3 times per week", bloodType: "O+", specialty: "general", patientType: "human" },
  { name: "Youssef Idrissi", phone: "+212600333003", email: "youssef.idrissi@email.com", gender: "male", dob: new Date("1978-11-08"), language: "en", primaryDiagnosis: "Coronary artery disease", chronicConditions: "Heart disease, High blood pressure", allergies: "Aspirin", currentMedications: "Atorvastatin 20mg, Aspirin 81mg", medicalNotes: "Post-heart attack 2023. Monitor closely.", bloodType: "AB-", specialty: "cardiology", patientType: "human" },
  { name: "Samira Chaoui", phone: "+212600444004", email: "samira.chaoui@email.com", gender: "female", dob: new Date("2000-05-30"), language: "en", primaryDiagnosis: "Anxiety disorder", chronicConditions: "None", allergies: "None known", currentMedications: "Sertraline 50mg", medicalNotes: "In therapy. Doing well.", bloodType: "B+", specialty: "general", patientType: "human" },
  { name: "Hassan Ouazzani", phone: "+212600555005", email: "hassan.ouazzani@email.com", gender: "male", dob: new Date("1965-09-12"), language: "fr", primaryDiagnosis: "COPD", chronicConditions: "Chronic bronchitis, Emphysema", allergies: "Codeine", currentMedications: "Tiotropium 18mcg, Salbutamol PRN", medicalNotes: "Oxygen at 2L at night. No smoking.", bloodType: "O-", specialty: "general", patientType: "human" },
  { name: "Nadia Bensouda", phone: "+212600666006", email: "nadia.bensouda@email.com", gender: "female", dob: new Date("1995-12-25"), language: "en", primaryDiagnosis: "Hypothyroidism", chronicConditions: "None", allergies: "Latex", currentMedications: "Levothyroxine 75mcg", medicalNotes: "Stable. Annual checkup.", bloodType: "A-", specialty: "general", patientType: "human" },
  { name: "Karim Mansouri", phone: "+212600777007", email: "karim.mansouri@email.com", gender: "male", dob: new Date("1988-04-18"), language: "en", primaryDiagnosis: "Migraine", chronicConditions: "None", allergies: "Ibuprofen", currentMedications: "Sumatriptan 50mg PRN", medicalNotes: "Triggers: stress, lack of sleep", bloodType: "B-", specialty: "general", patientType: "human" },
];

const OUTBOUND_TRANSCRIPTS = [
  [
    { question: "Hello, am I speaking with Ahmed Benali? This is Dr. Amiri calling from Oriveo Clinic.", answer: "Yes, this is Ahmed." },
    { question: "How are you feeling today? Have you had any chest pain or discomfort?", answer: "I've been feeling okay. No chest pain this week." },
    { question: "Are you taking your Metformin and Lisinopril regularly?", answer: "Yes, every day like you told me. Sometimes I forget the evening dose." },
    { question: "Have you noticed any swelling in your ankles or feet?", answer: "A little bit, yes. Especially at the end of the day." },
    { question: "That's good to know. I'd recommend elevating your feet when you sit. Have you checked your blood sugar recently?", answer: "This morning it was 145. It's been between 130 and 150 lately." },
    { question: "That's a bit high. Let's schedule a follow-up to adjust your medication. Any other concerns?", answer: "No, that's all. Thank you for checking in." },
  ],
  [
    { question: "Hello, am I speaking with Fatima Zahra El Amrani?", answer: "Yes, this is Fatima." },
    { question: "How has your breathing been this week? Have you used your inhaler?", answer: "I've been using it almost every day. The weather has been bad for my allergies." },
    { question: "I'm sorry to hear that. Are you coughing more than usual?", answer: "Yes, especially at night. It's been keeping me awake." },
    { question: "That sounds uncomfortable. Are you bringing up any phlegm?", answer: "Just clear stuff, no color. But a lot of it." },
    { question: "I think we should consider adjusting your medication. I'll have a doctor review your case and call you. In the meantime, try to stay indoors when the pollen count is high.", answer: "Okay, I'll do that. Thank you." },
    { question: "Take care of yourself Fatima. We'll be in touch soon.", answer: "Thank you. Bye." },
  ],
  [
    { question: "Good morning, am I speaking with Youssef Idrissi?", answer: "Yes, speaking." },
    { question: "This is your automated checkup call. How have you been feeling since your last visit?", answer: "Pretty good overall. No major issues." },
    { question: "Have you experienced any chest pain, shortness of breath, or dizziness?", answer: "No chest pain. Sometimes I feel a bit dizzy when I stand up too fast." },
    { question: "That could be related to your blood pressure medication. Are you taking your Atorvastatin and Aspirin daily?", answer: "Yes, every day without fail." },
    { question: "Excellent. And are you following the heart-healthy diet we discussed?", answer: "Mostly. I cut out red meat and I'm walking 20 minutes daily." },
    { question: "That's wonderful progress! Keep it up. We'll schedule your next appointment for 3 months.", answer: "Sounds good, thank you." },
  ],
  [
    { question: "Hello Samira, this is Oriveo Clinic calling for your routine checkup.", answer: "Hi, thanks for calling." },
    { question: "How have you been managing your anxiety since we last spoke?", answer: "Better, I think. The medication seems to be helping." },
    { question: "That's great to hear! Have you been sleeping well?", answer: "Some nights are better than others. I still have trouble falling asleep sometimes." },
    { question: "Have you been practicing the breathing exercises we discussed?", answer: "Yes, they help when I feel anxious. I do them before bed." },
    { question: "Wonderful. Are you still seeing your therapist regularly?", answer: "Yes, twice a month. She's been very helpful." },
    { question: "That's excellent, Samira. Keep up the great work. We'll check in again next month.", answer: "Thank you so much." },
  ],
  [
    { question: "Hello Hassan, this is Oriveo Clinic calling for your checkup.", answer: "Hello." },
    { question: "How has your breathing been? Are you using your oxygen at night?", answer: "Yes, every night. I've been more short of breath during the day lately." },
    { question: "I see. Are you using your inhaler more often?", answer: "Almost every 4 hours now. Walking to the kitchen leaves me winded." },
    { question: "That's concerning. Are you coughing up anything unusual?", answer: "More phlegm than usual, yellowish. No fever though." },
    { question: "Hassan, I'm going to flag this for urgent review. A doctor will call you within the next hour. Please rest and use your oxygen if needed.", answer: "Okay, I'll wait for the call." },
  ],
  [
    { question: "Good afternoon Nadia, this is your automated health checkup.", answer: "Hi there!" },
    { question: "How are you feeling today?", answer: "Good, feeling normal. No complaints." },
    { question: "Are you taking your Levothyroxine as prescribed?", answer: "Yes, every morning on an empty stomach like I'm supposed to." },
    { question: "Have you had any unusual fatigue, weight changes, or temperature sensitivity?", answer: "No, nothing like that. I feel pretty stable." },
    { question: "That's excellent to hear. When was your last blood test?", answer: "About 3 months ago. My TSH was normal." },
    { question: "Perfect. We'll schedule your next test in 6 months. Keep up the good work!", answer: "Thank you, have a great day!" },
  ],
  [
    { question: "Hello Karim, this is Oriveo Clinic calling for your checkup.", answer: "Hey, thanks for calling." },
    { question: "How have your migraines been since we last spoke?", answer: "I've had 3 bad ones this month. Usually I can manage with one or two." },
    { question: "I'm sorry to hear that. Are you able to identify any triggers?", answer: "Stress at work mostly. And I haven't been sleeping well." },
    { question: "Have you been taking your Sumatriptan when you feel one coming on?", answer: "Yes, it helps if I take it early enough. But sometimes I wake up with one already full-blown." },
    { question: "That's tough. Let me recommend you track your sleep and stress levels. We may need to adjust your preventive plan.", answer: "Yeah, I'll start tracking. Should I come in for a visit?" },
    { question: "Yes, let's schedule an appointment for next week to discuss further.", answer: "Perfect. Thanks for checking in." },
  ],
];

const INBOUND_TRANSCRIPTS = [
  [
    { question: "Welcome to Oriveo Clinic. I'm your virtual medical assistant. Could you please tell me your full name so I can pull up your records?", answer: "Ahmed Benali." },
    { question: "Thank you, Ahmed. Let me look you up in our system.", answer: "" },
    { question: "I found you, Ahmed. How can I help you today?", answer: "I've been feeling dizzy lately and my blood sugar has been high." },
    { question: "I'm sorry to hear that. What has your blood sugar been reading?", answer: "Around 160-180 in the mornings. It used to be around 130." },
    { question: "That is higher than your usual range. Have you been taking your medications as prescribed?", answer: "Yes, but I think my dose might need adjustment." },
    { question: "That's a good insight. I'm going to flag this for your doctor to review your medication. In the meantime, stay hydrated and avoid sugary foods.", answer: "Okay, I'll do that. Thank you." },
  ],
  [
    { question: "Welcome to Oriveo Clinic. Could you please state your full name?", answer: "Fatima El Amrani." },
    { question: "Thank you, Fatima. How can I assist you today?", answer: "I'm having trouble breathing. My inhaler isn't helping." },
    { question: "I understand that must be scary. When did this start?", answer: "About 2 hours ago. It's getting worse." },
    { question: "Fatima, I'm concerned about your breathing difficulty. Please go to the nearest emergency room or call 911 immediately. I'm alerting your doctor right now.", answer: "Okay, I'll go to the hospital now." },
  ],
  [
    { question: "Welcome to Oriveo Clinic. May I have your full name please?", answer: "It's for my mother, Nadia Bensouda. She can't come to the phone." },
    { question: "Thank you for calling on her behalf. What is your name and relation to the patient?", answer: "I'm her daughter, Sarah." },
    { question: "Thank you Sarah. What seems to be the concern regarding Nadia?", answer: "She's been very fatigued and confused today. More than usual." },
    { question: "I see. Has she been taking her thyroid medication?", answer: "I'm not sure. She lives alone and I just visited today." },
    { question: "This could be related to her thyroid. I recommend you take her to the clinic for a checkup. I'll also alert her doctor.", answer: "Thank you, I'll take her right now." },
  ],
];

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function rn(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

function randomDate(daysBack) {
  const now = Date.now();
  const past = now - daysBack * 24 * 60 * 60 * 1000;
  return new Date(past + Math.random() * (now - past));
}

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB");
  const db = mongoose.connection.db;

  const org = await db.collection("organizations").findOne({});
  const orgId = org?._id || null;
  const user = await db.collection("users").findOne({ email: "anassamiri87@gmail.com" });
  const userId = user?._id || null;
  const adminUser = await db.collection("users").findOne({ email: "admin@oriveo.io" });
  const adminId = adminUser?._id || null;

  if (!orgId) console.log("WARNING: No organization found");
  if (!userId) console.log("WARNING: No clinic user found");

  // ── 1. Patients ──
  const existingPatients = await db.collection("patients").find({}).toArray();
  let patientIds = existingPatients.map(p => p._id);

  if (existingPatients.length < 7) {
    console.log("Creating additional patients...");
    for (const pData of PATIENTS) {
      const exists = existingPatients.find(e => e.phone === pData.phone);
      if (exists) continue;
      const res = await db.collection("patients").insertOne({
        ...pData,
        organization: orgId,
        createdBy: userId,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      patientIds.push(res.insertedId);
      console.log(`  Created patient: ${pData.name}`);
    }
  }
  console.log(`Total patients: ${patientIds.length}`);

  // ── 2. Default Questionnaire ──
  let questionnaireId = null;
  const existingQ = await db.collection("questionnaires").findOne({ isDefault: true });
  if (existingQ) {
    questionnaireId = existingQ._id;
  } else {
    const existingAny = await db.collection("questionnaires").findOne({});
    questionnaireId = existingAny?._id;
  }

  if (!questionnaireId) {
    const qRes = await db.collection("questionnaires").insertOne({
      title: "General Health Checkup",
      description: "Standard checkup questionnaire for all patients",
      language: "en",
      category: "general",
      isDefault: true,
      createdBy: userId,
      questions: [
        { text: "How are you feeling today?", order: 1, type: "open" },
        { text: "Have you had any pain or discomfort since your last checkup?", order: 2, type: "open" },
        { text: "Are you taking your medications as prescribed?", order: 3, type: "yesno" },
        { text: "Have you noticed any new symptoms?", order: 4, type: "open" },
        { text: "How is your appetite and sleep?", order: 5, type: "open" },
        { text: "Is there anything specific you'd like to discuss with your doctor?", order: 6, type: "open" },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    questionnaireId = qRes.insertedId;
    console.log("Created default questionnaire");
  }

  // ── 3. Outbound Calls (if less than 15) ──
  const existingCalls = await db.collection("calls").find({}).toArray();
  const outboundCount = existingCalls.filter(c => c.direction !== "inbound").length;

  if (outboundCount < 12) {
    console.log("Creating outbound calls...");
    for (let i = 0; i < PATIENTS.length && i < OUTBOUND_TRANSCRIPTS.length; i++) {
      const patient = await db.collection("patients").findOne({ _id: patientIds[i] });
      if (!patient) continue;
      const severity = rn(2, 9);
      const transcript = OUTBOUND_TRANSCRIPTS[i];
      const duration = rn(120, 480);
      const prevCalls = existingCalls.filter(c => String(c.patient) === String(patientIds[i]));
      if (prevCalls.length >= 2) continue;

      await db.collection("calls").insertOne({
        direction: "outbound",
        organization: orgId,
        patient: patientIds[i],
        questionnaire: questionnaireId,
        startedBy: userId,
        status: i < 2 ? "in-progress" : "completed",
        startedAt: randomDate(14),
        endedAt: new Date(),
        duration,
        transcript,
        aiSummary: transcript.map(t => t.question).join(" ").substring(0, 100),
        aiSeverityScore: severity,
        aiRecommendations: severity >= 7
          ? "Urgent: Schedule follow-up within 24 hours. Notify attending physician."
          : severity >= 4
            ? "Schedule follow-up in 1 week. Monitor symptoms."
            : "Patient stable. Routine follow-up in 3 months.",
        language: patient.language || "en",
        patientResponded: true,
        recallCount: 0,
        triageTier: severity >= 7 ? 1 : severity >= 4 ? 2 : 3,
        highestTier: severity >= 7 ? 1 : severity >= 4 ? 2 : 3,
        redFlags: severity >= 7
          ? [{ tier: 0, keyword: "elevated severity", text: "AI severity score >= 7", crisis: false }]
          : severity >= 4
            ? [{ tier: 1, keyword: "moderate", text: "Moderate severity", crisis: false }]
            : [],
        identityVerified: true,
        consentRecorded: true,
        emotionalState: { primary: "neutral", intensity: rn(1, 5), painLevel: null },
        emergencyDetected: severity >= 7 && Math.random() > 0.5,
        emergencyActionTaken: "none",
        createdAt: randomDate(14),
        updatedAt: new Date(),
      });
      console.log(`  Created outbound call for ${patient.name} (sev: ${severity})`);
    }
  }

  // ── 4. Inbound Calls ──
  const inboundExisting = existingCalls.filter(c => c.direction === "inbound");
  if (inboundExisting.length < 4) {
    console.log("Creating inbound calls...");
    const inbounds = [
      { patientIdx: 0, transcriptIdx: 0, severity: 6, emergency: false, responded: true, status: "completed" },
      { patientIdx: 1, transcriptIdx: 1, severity: 9, emergency: true, responded: true, status: "completed", emergencyType: "medical" },
      { patientIdx: 5, transcriptIdx: 2, severity: 4, emergency: false, responded: true, status: "completed" },
      { patientIdx: null, transcriptIdx: null, severity: null, emergency: false, responded: false, status: "failed" },
      { patientIdx: 6, transcriptIdx: null, severity: null, emergency: false, responded: false, status: "failed" },
    ];

    for (const inbound of inbounds) {
      const patientId = inbound.patientIdx !== null ? patientIds[inbound.patientIdx] : null;
      const patient = patientId ? await db.collection("patients").findOne({ _id: patientId }) : null;
      const transcript = inbound.transcriptIdx !== null ? INBOUND_TRANSCRIPTS[inbound.transcriptIdx] : [];

      const callData = {
        direction: "inbound",
        organization: orgId,
        patient: patientId,
        questionnaire: questionnaireId,
        startedBy: null,
        status: inbound.status,
        startedAt: randomDate(7),
        endedAt: inbound.responded ? new Date() : null,
        duration: inbound.responded ? rn(60, 300) : 0,
        transcript,
        aiSummary: transcript.length > 0 ? transcript.map(t => t.question).join(" ").substring(0, 80) : "",
        aiSeverityScore: inbound.severity,
        aiRecommendations: inbound.emergency
          ? "EMERGENCY: Patient advised to go to ER. Doctor notified."
          : inbound.severity >= 5
            ? "Schedule follow-up appointment."
            : "No immediate action needed.",
        language: patient?.language || "en",
        patientResponded: inbound.responded,
        recallCount: 0,
        triageTier: inbound.emergency ? 0 : inbound.severity >= 5 ? 2 : 3,
        highestTier: inbound.emergency ? 0 : inbound.severity >= 5 ? 2 : 3,
        redFlags: inbound.emergency
          ? [{ tier: 0, keyword: "breathing difficulty", text: "Patient reported worsening breathing difficulty", crisis: false }]
          : inbound.severity >= 5
            ? [{ tier: 1, keyword: "elevated blood sugar", text: "Blood sugar higher than normal range", crisis: false }]
            : [],
        emergencyDetected: inbound.emergency,
        emergencyActionTaken: inbound.emergency ? "called_clinic" : "none",
        emergencyCalledAt: inbound.emergency ? new Date() : null,
        emergencyType: inbound.emergency ? "medical" : null,
        identityVerified: inbound.responded && patientId !== null,
        consentRecorded: inbound.responded,
        emotionalState: inbound.emergency
          ? { primary: "fear", intensity: 8, painLevel: null }
          : inbound.responded ? { primary: "neutral", intensity: 3, painLevel: null } : { primary: "neutral", intensity: 0, painLevel: null },
        twilioCallSid: `IN${String(Date.now()).slice(-10)}${rn(100, 999)}`,
        createdAt: randomDate(7),
        updatedAt: new Date(),
      };

      if (!inbound.responded && !patient) {
        callData.aiSummary = "";
        callData.organization = null;
      }

      await db.collection("calls").insertOne(callData);
      console.log(`  Created inbound call: ${patient?.name || "Unknown caller"} (sev: ${inbound.severity || "N/A"}, ${inbound.responded ? "answered" : "unanswered"})`);
    }
  }

  // ── 5. Reports ──
  const completedCalls = await db.collection("calls").find({ status: "completed", $or: [{ reportGenerated: { $ne: true } }, { reportGenerated: { $exists: false } }] }).toArray();
  const existingReports = await db.collection("reports").find({}).toArray();
  const existingReportCallIds = new Set(existingReports.map(r => String(r.call)));

  if (completedCalls.length > 0) {
    console.log("Creating reports...");
    let reportCount = 0;
    for (const call of completedCalls) {
      if (existingReportCallIds.has(String(call._id))) continue;
      if (reportCount >= 8) break;
      const patient = call.patient ? await db.collection("patients").findOne({ _id: call.patient }) : null;
      if (!patient) continue;

      await db.collection("reports").insertOne({
        call: call._id,
        patient: patient._id,
        generatedBy: userId || adminId,
        patientInfo: {
          name: patient.name,
          age: patient.dob ? Math.floor((new Date() - new Date(patient.dob)) / 31557600000) : null,
          gender: patient.gender,
          phone: patient.phone,
        },
        chiefComplaint: call.aiSummary?.substring(0, 100) || "Routine checkup",
        symptomsCaptured: call.transcript?.slice(0, 3).map(t => ({ symptom: t.question.substring(0, 30), severity: rn(1, 5) })) || [],
        redFlags: call.redFlags?.map(f => f.keyword) || [],
        triageLevel: call.triageTier,
        triageLabel: call.triageTier <= 0 ? "Emergency" : call.triageTier <= 1 ? "Urgent" : call.triageTier <= 2 ? "Moderate" : "Low",
        aiAssessment: call.aiSummary || "Routine checkup completed. Patient stable.",
        adviceGiven: call.aiRecommendations || "Continue current medications. Follow up as scheduled.",
        medicationsReviewed: patient.currentMedications || "None",
        allergiesFlagged: patient.allergies || "None",
        chronicConditions: patient.chronicConditions || "None",
        vitalsMentioned: "",
        keyExchanges: call.transcript?.slice(0, 4).flatMap(t => [
          { speaker: "AI", text: t.question },
          { speaker: "Patient", text: t.answer },
        ]) || [],
        nextSteps: call.aiRecommendations?.split(". ").map(s => s.trim()).filter(Boolean) || ["Schedule follow-up"],
        aiQaScores: {
          accuracy: rn(75, 98),
          empathy: rn(70, 95),
          professionalism: rn(80, 98),
          adherence: rn(75, 95),
          resolution: rn(70, 92),
          overall: rn(75, 95),
        },
        callSummary: call.aiSummary || "Automated checkup call completed",
        callDuration: call.duration,
        callDate: call.createdAt,
        doctorSigned: false,
        digitalSignature: "",
        signatureTitle: "",
        doctorNotes: "",
        createdAt: call.createdAt,
      });
      await db.collection("calls").updateOne({ _id: call._id }, { $set: { reportGenerated: true } });
      reportCount++;
      console.log(`  Created report for ${patient.name}`);
    }
  }

  // ── 6. Appointments ──
  const existingAppts = await db.collection("appointments").find({}).toArray();
  if (existingAppts.length < 6) {
    console.log("Creating appointments...");
    const apptTypes = ["in-person", "phone", "video"];
    const apptStatuses = ["scheduled", "confirmed", "completed"];
    for (let i = existingAppts.length; i < Math.max(6, patientIds.length); i++) {
      const patient = await db.collection("patients").findOne({ _id: patientIds[i % patientIds.length] });
      if (!patient) continue;
      const apptDate = new Date();
      apptDate.setDate(apptDate.getDate() + rn(1, 30));
      apptDate.setHours(rn(9, 17), rn(0, 3) * 15, 0, 0);

      await db.collection("appointments").insertOne({
        patient: patient._id,
        bookedBy: userId,
        title: `${pick(["Follow-up", "Routine Checkup", "Medication Review", "Test Results Discussion"])} — ${patient.name}`,
        description: pick(["Regular checkup", "Review lab results", "Discuss treatment plan", "Follow up on symptoms"]),
        date: apptDate,
        duration: pick([15, 30, 45, 60]),
        location: pick(["Main Clinic Room 1", "Main Clinic Room 2", "Phone Call", "Video Call"]),
        type: pick(apptTypes),
        status: pick(apptStatuses),
        notes: "",
        reason: pick(["Routine", "Follow-up", "Medication adjustment", "Test results"]),
        reminderSent: Math.random() > 0.5,
        createdAt: randomDate(14),
        updatedAt: new Date(),
      });
      console.log(`  Created appointment for ${patient.name}`);
    }
  }

  // ── 7. Audit Log entries for inbound calls ──
  const inboundLogs = await db.collection("auditlogs").countDocuments({ action: /inbound/ });
  if (inboundLogs < 5) {
    console.log("Creating inbound audit logs...");
    const inboundActions = ["inbound.call.received", "inbound.call.identified", "inbound.call.completed", "inbound.call.failed", "inbound.call.emergency"];
    for (const action of inboundActions) {
      await db.collection("auditlogs").insertOne({
        action,
        userId: userId || adminId,
        resourceType: "Call",
        resourceId: null,
        details: { direction: "inbound", timestamp: new Date().toISOString() },
        ip: "127.0.0.1",
        userAgent: "Oriveo Seed",
        createdAt: randomDate(7),
      });
    }
    console.log("  Created inbound audit logs");
  }

  console.log("✅ Seed complete!");
  console.log(`  Patients: ${patientIds.length}`);
  console.log(`  Total calls: ${await db.collection("calls").countDocuments()}`);
  console.log(`  Reports: ${await db.collection("reports").countDocuments()}`);
  console.log(`  Appointments: ${await db.collection("appointments").countDocuments()}`);
  console.log(`  Audit logs: ${await db.collection("auditlogs").countDocuments()}`);

  await mongoose.disconnect();
}

seed().catch(err => { console.error("Seed error:", err); process.exit(1); });
