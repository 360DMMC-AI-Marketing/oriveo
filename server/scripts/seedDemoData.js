import mongoose from "mongoose";
import AuditLog from "../models/AuditLog.js";
import Call from "../models/Call.js";
import CallEvent from "../models/CallEvent.js";
import Report from "../models/Report.js";

const MONGO_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/statvox";

const AUDIT_ACTIONS = [
  "patient.viewed", "patient.updated", "patient.created",
  "call.viewed", "call.transcript.viewed", "call.recorded", "call.transferred",
  "ehr.synced", "ehr.exported",
  "settings.changed",
  "user.login", "user.logout", "api.access",
];

const RESOURCE_TYPES = ["Patient", "Call", "Appointment", "Questionnaire", "Config", "User", "Group"];

function randomDate(daysBack) {
  const now = Date.now();
  const past = now - daysBack * 24 * 60 * 60 * 1000;
  return new Date(past + Math.random() * (now - past));
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function rn(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB");

  const db = mongoose.connection.db;

  // ── 1. Get existing data ──
  const users = await db.collection("users").find({}).toArray();
  const patients = await db.collection("patients").find({}).toArray();
  const calls = await db.collection("calls").find({}).toArray();
  const orgs = await db.collection("organizations").find({}).toArray();

  console.log(`Found ${users.length} users, ${patients.length} patients, ${calls.length} calls, ${orgs.length} orgs`);

  if (!users.length) {
    console.log("No users found — skipping audit logs");
  } else {
    // ── 2. Clear old audit logs ──
    const deleted = await db.collection("auditlogs").deleteMany({});
    console.log(`Cleared ${deleted.deletedCount} old audit logs`);

    // ── 3. Generate 200 audit log entries over 30 days ──
    const auditBatch = [];
    for (let i = 0; i < 200; i++) {
      const user = pick(users);
      const action = pick(AUDIT_ACTIONS);
      const resourceType = pick(RESOURCE_TYPES);
      const resourceId = resourceType === "Call" && calls.length
        ? pick(calls)._id.toString()
        : resourceType === "Patient" && patients.length
          ? pick(patients)._id.toString()
          : new mongoose.Types.ObjectId().toString();

      const descriptions = {
        "patient.viewed": `Viewed patient ${pick(patients)?.name || "Unknown"} medical record`,
        "patient.updated": `Updated ${pick(["allergies", "medications", "demographics", "emergency contact"])} for patient`,
        "patient.created": `Created new patient record`,
        "call.viewed": `Reviewed call transcript and AI summary`,
        "call.transcript.viewed": `Downloaded full transcript of call`,
        "call.recorded": `Call recording saved to storage`,
        "call.transferred": `Call transferred to human provider`,
        "ehr.synced": `Synchronized clinical data with athenahealth EHR`,
        "ehr.exported": `Exported patient summary for referral`,
        "settings.changed": `Updated ${pick(["notification preferences", "call schedule", "language settings", "security settings"])}`,
        "user.login": `Login from ${pick(["Chrome 120", "Firefox 115", "Safari 17", "Edge 118"])}`,
        "user.logout": `User logged out`,
        "api.access": `API access — ${pick(["reports/generate", "patients/search", "calls/stats", "analytics/overview", "admin/health"])}`,
      };

      auditBatch.push({
        action,
        userId: user._id,
        userEmail: user.email || "",
        userRole: user.role || "doctor",
        resourceType,
        resourceId,
        description: descriptions[action] || `Performed ${action}`,
        ipAddress: `${rn(10, 223)}.${rn(0, 255)}.${rn(0, 255)}.${rn(1, 254)}`,
        userAgent: pick([
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
          "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) AppleWebKit/537.36",
        ]),
        metadata: {
          ip_location: pick(["Casablanca, MA", "Rabat, MA", "Marrakech, MA", "Tanger, MA"]),
          user_agent: "web",
        },
        timestamp: randomDate(30),
      });
    }
    await db.collection("auditlogs").insertMany(auditBatch);
    console.log(`Inserted ${auditBatch.length} audit log entries`);
  }

  // ── 4. Update existing calls with realistic data ──
  if (calls.length) {
    const callSeverities = [9, 8, 7, 6, 5, 4, 3, 2, 1];
    const callSummaries = [
      "Patient reported mild headache and fatigue. No red flags. Advised rest and hydration. Follow-up in 3 days.",
      "Elderly patient with hypertension reporting dizziness upon standing. Advised to monitor BP and schedule PCP visit.",
      "Diabetic patient with foot numbness. Screened for neuropathy. Advised podiatry follow-up.",
      "Patient with asthma reporting increased use of inhaler. Symptoms triggered by pollen. Advised allergy consult.",
      "Well-child checkup. Parent reports no concerns. Growth on track. Vaccinations up to date.",
      "Patient with chest pain radiating to left arm. EMERGENCY PROTOCOL ACTIVATED. Advised immediate ER.",
      "Post-op follow-up. Surgical site healing well. No signs of infection. Remove sutures in 5 days.",
      "Patient with severe migraine lasting 3 days. Medication not helping. Urgent neurology referral recommended.",
      "COVID-19 screening. Patient reports loss of taste and smell. Advised testing and isolation.",
      "Mental health check-in. Patient reports anxiety and difficulty sleeping. Referred to counseling services.",
      "Patient with abdominal pain and nausea. Rule out appendicitis. Advised urgent care evaluation.",
      "Respiratory symptoms with fever >39C for 2 days. Advised ED evaluation for possible pneumonia.",
      "Medication refill request for hypertension. BP well controlled. Refill authorized for 90 days.",
      "Patient with back pain after lifting. No neurological deficits. Advised ice, rest, and PT referral.",
      "Routine wellness call. All vitals stable. Health maintenance reminders provided.",
    ];
    const triageTiers = [0, 0, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3];
    const statuses = ["completed", "completed", "completed", "completed", "completed", "failed", "scheduled", "in-progress", "cancelled"];

    for (let i = 0; i < calls.length; i++) {
      const call = calls[i];
      const severity = pick(callSeverities);
      const summary = pick(callSummaries);
      const triageTier = pick(triageTiers);
      const status = pick(statuses);

      await db.collection("calls").updateOne(
        { _id: call._id },
        {
          $set: {
            aiSeverityScore: severity,
            aiSummary: summary,
            triageTier,
            highestTier: Math.max(triageTier, call.highestTier || triageTier),
            status,
            duration: rn(30, 600),
            startedAt: randomDate(14),
            endedAt: randomDate(14),
            patientResponded: Math.random() > 0.25,
            language: pick(["en", "en", "en", "en", "fr", "ar"]),
            emotionalState: {
              primary: pick(["neutral", "anxious", "calm", "concerned", "distressed", "frustrated"]),
              intensity: rn(1, 8),
              painLevel: pick([null, null, "mild", "moderate", "severe"]),
            },
            redFlags: severity >= 7
              ? [
                  { tier: 0, keyword: pick(["chest pain", "difficulty breathing", "severe bleeding", "suicidal thoughts"]), text: "Emergency keyword detected", crisis: false },
                  { tier: 1, keyword: pick(["high fever", "severe pain", "vomiting blood"]), text: "Urgent concern noted", crisis: false },
                ]
              : severity >= 5
                ? [{ tier: 2, keyword: pick(["persistent cough", "mild fever", "dizziness"]), text: "Routine flag", crisis: false }]
                : [],
            concerningStatements: severity >= 7
              ? [
                  { text: pick(["It hurts when I breathe", "I feel like I'm going to pass out", "The pain is getting worse"]), timestamp: rn(10, 300), flags: ["pain", "distress"] },
                ]
              : [],
            aiRecommendations: severity >= 7
              ? "Immediate medical attention required. Advise patient to go to ER or call 911."
              : severity >= 5
                ? "Schedule follow-up within 24 hours. Monitor symptoms closely."
                : "Routine follow-up recommended. No urgent concerns.",
            nextAppointmentDate: severity < 5 ? randomDate(14) : null,
            nextAppointmentPlace: severity < 5 ? pick(["Primary Care", "Cardiology", "Neurology", "Orthopedics", "ENT"]) : null,
            crisisPathwayUsed: severity >= 8 && Math.random() > 0.7,
            scheduledAt: randomDate(7),
            recallCount: status === "failed" ? rn(1, 3) : 0,
            transcript: [
              { question: "Hello, this is StatVox calling from your healthcare provider. How are you feeling today?", answer: severity >= 7 ? pick(["Not good at all", "I'm in a lot of pain", "Something is wrong"]) : pick(["I'm okay", "Doing alright", "Feeling better"]), timestamp: 5 },
              { question: "Can you describe what symptoms you're experiencing?", answer: severity >= 7 ? pick(["Chest pain and shortness of breath", "Severe headache and blurred vision", "High fever and chills"]) : pick(["Just a little tired", "Mild headache", "Some congestion"]), timestamp: 30 },
              { question: "How long have you had these symptoms?", answer: pick(["Since yesterday", "About 3 days", "Almost a week"]), timestamp: 60 },
              { question: "On a scale of 1-10, how severe is your pain?", answer: severity >= 7 ? pick(["8", "9", "10"]) : pick(["2", "3", "4", "5"]), timestamp: 90 },
            ],
            qaScore: {
              scores: { accuracy: rn(70, 98), empathy: rn(75, 95), professionalism: rn(80, 99), adherence: rn(70, 95), resolution: rn(60, 90) },
              overall: rn(70, 95),
              strengths: pick([["Accurate assessment", "Compassionate tone"], ["Clear communication", "Good follow-up"], ["Thorough questioning"]]),
              weaknesses: severity >= 7 ? [pick(["Escalation delay", "Missed follow-up question"])] : [],
              summary: `QA Score — ${severity >= 7 ? "Emergency" : "Routine"} call handled ${severity < 5 ? "appropriately" : "with proper escalation protocols"}.`,
              scoredAt: randomDate(3),
            },
          },
        }
      );
    }
    console.log(`Updated ${calls.length} calls with enriched demo data`);
  }

  // ── 5. Generate CallEvent records ──
  const updatedCalls = await db.collection("calls").find({}).toArray();
  if (updatedCalls.length) {
    const deletedEvents = await db.collection("callevents").deleteMany({});
    console.log(`Cleared ${deletedEvents.deletedCount} old call events`);

    const eventBatch = [];
    for (const call of updatedCalls) {
      const eventCount = rn(3, 8);
      for (let i = 0; i < eventCount; i++) {
        const eventTypes = ["transcript", "triage", "emotion", "error", "transfer", "language_detected", "state_change"];
        const type = pick(eventTypes);

        const dataMap = {
          transcript: { text: pick(["Patient reported symptoms", "Follow-up question asked", "Patient confirmed understanding"]), turn: i },
          triage: { tier: call.triageTier ?? 3, level: pick(["emergency", "urgent", "routine", "stable"]), keyword: pick(["chest pain", "fever", "cough", "fatigue", ""]) },
          emotion: { primary: pick(["neutral", "anxious", "calm", "distressed"]), intensity: rn(1, 8), painLevel: pick([null, "mild", "moderate"]) },
          error: { code: pick(["STT_FAILURE", "TTS_FAILURE", "TIMEOUT"]), message: "Service temporarily unavailable", recovered: Math.random() > 0.5 },
          transfer: { reason: "Patient requested human", target: pick(["doctor", "nurse", "specialist"]), successful: Math.random() > 0.3 },
          language_detected: { language: pick(["en", "fr", "ar"]), confidence: rn(80, 99) / 100 },
          state_change: { from: pick(["scheduled", "in-progress"]), to: pick(["completed", "in-progress", "failed"]), reason: "Normal flow" },
        };

        eventBatch.push({
          organization: call.organization || null,
          callId: call._id,
          type,
          data: dataMap[type] || {},
          timestamp: randomDate(14),
        });
      }
    }
    await db.collection("callevents").insertMany(eventBatch);
    console.log(`Inserted ${eventBatch.length} call events`);
  }

  // ── 6. Generate demo reports if none exist ──
  const reportCount = await db.collection("reports").countDocuments();
  if (reportCount === 0 && updatedCalls.length) {
    const reportBatch = [];
    const completedCalls = updatedCalls.filter((c) => c.status === "completed").slice(0, 10);
    for (let i = 0; i < completedCalls.length; i++) {
      const call = completedCalls[i];
      const severity = call.aiSeverityScore ?? 5;
      reportBatch.push({
        organization: call.organization || null,
        patient: call.patient,
        call: call._id,
        generatedBy: call.startedBy,
        chiefComplaint: call.aiSummary?.slice(0, 100) || "Routine checkup",
        symptomsCaptured: severity >= 7
          ? [{ symptom: "Chest pain", severity: "severe", duration: "2 days" }, { symptom: "Shortness of breath", severity: "moderate", duration: "1 day" }]
          : [{ symptom: "Mild headache", severity: "mild", duration: "3 days" }],
        redFlags: severity >= 7 ? ["Chest pain with exertion", "History of hypertension"] : [],
        triageLevel: call.triageTier ?? 3,
        aiAssessment: call.aiSummary || "Patient presented for routine checkup. No significant findings.",
        adviceGiven: severity >= 7 ? "Advised immediate ER evaluation" : "Continue current medications. Rest and monitor symptoms.",
        medicationsReviewed: severity >= 5 ? "Lisinopril 10mg daily, Metformin 500mg BID" : "No regular medications reported",
        allergiesFlagged: Math.random() > 0.7 ? "Penicillin" : "None reported",
        chronicConditions: severity >= 5 ? "Hypertension, Type 2 diabetes" : "None",
        vitalsMentioned: "BP 130/85, HR 72, Temp 36.8C",
        keyExchanges: call.transcript?.slice(0, 4).map((t) => ({ speaker: "AI", text: t.question })).concat(
          call.transcript?.slice(0, 4).map((t) => ({ speaker: "Patient", text: t.answer }))
        ) || [],
        nextSteps: severity >= 7
          ? ["Immediate ER evaluation", "Cardiology follow-up", "ECG within 1 hour"]
          : ["Continue monitoring", "Follow-up in 2 weeks", "Maintain medication compliance"],
        callSummary: call.aiSummary || "Routine checkup completed. Patient stable.",
        aiQaScores: { accuracy: rn(80, 98), empathy: rn(75, 95), professionalism: rn(85, 99), adherence: rn(80, 95), resolution: rn(70, 90), overall: rn(78, 95) },
        doctorSigned: Math.random() > 0.5,
        signedBy: Math.random() > 0.5 ? call.startedBy : null,
        signedAt: Math.random() > 0.5 ? randomDate(7) : null,
        createdAt: call.createdAt || randomDate(14),
        updatedAt: randomDate(7),
      });
    }
    if (reportBatch.length) {
      await db.collection("reports").insertMany(reportBatch);
      console.log(`Generated ${reportBatch.length} demo reports`);
    }
  }

  console.log("\n✅ Demo data seeding complete!");
  console.log("   ✓ Audit logs: 200 entries over 30 days");
  console.log(`   ✓ Calls: ${calls.length} enriched with severity, summary, triage`);
  console.log(`   ✓ CallEvents generated`);
  console.log("   ✓ Reports generated (if none existed)");

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
