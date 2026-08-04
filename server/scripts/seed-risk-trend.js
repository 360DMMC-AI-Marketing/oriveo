import mongoose from "mongoose";
import Patient from "../models/Patient.js";
import User from "../models/User.js";
import Call from "../models/Call.js";

const MONGO_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/oriveo";
const ORG = "6a554f5f68ed3185349a78bf";

const daysAgo = (n, hour = 10) => {
  const d = new Date(Date.now() - n * 86400000);
  d.setHours(hour, 0, 0, 0);
  return d;
};

// Oldest → newest severities. Each patient gets 3 calls with a rising trend.
const TREND_PATIENTS = [
  {
    name: "Emma Rossi",
    email: "erossi@email.com",
    phone: "+212600000013",
    gender: "female",
    dob: "1976-05-14",
    language: "en",
    primaryDiagnosis: "Uncontrolled hypertension",
    severities: [6, 8, 9],
    summaries: [
      "Moderate hypertension, BP 158/96. Medication adherence discussed.",
      "BP rising, 174/102. Dose adjustment recommended.",
      "Severe hypertension, BP 186/112 with headache. Urgent evaluation advised.",
    ],
  },
  {
    name: "Omar Haddad",
    email: "ohaddad@email.com",
    phone: "+212600000014",
    gender: "male",
    dob: "1968-01-22",
    language: "fr",
    primaryDiagnosis: "Worsening heart failure",
    severities: [5, 7, 8],
    summaries: [
      "Mild exertional dyspnea. Weight stable. Continue current plan.",
      "Increased dyspnea and edema. Diuretic adjusted.",
      "Marked orthopnea, weight up 4kg. Urgent cardiology review.",
    ],
  },
];

async function run() {
  await mongoose.connect(MONGO_URI);
  const admin = await User.findOne({ organization: ORG, role: "admin" }).lean();
  if (!admin) {
    console.error("Admin user not found for org " + ORG);
    process.exit(1);
  }

  let created = 0;
  for (const tp of TREND_PATIENTS) {
    let patient = await Patient.findOne({ organization: ORG, email: tp.email });
    if (!patient) {
      patient = await Patient.create({
        organization: ORG,
        patientType: "human",
        specialty: "general",
        name: tp.name,
        email: tp.email,
        phone: tp.phone,
        gender: tp.gender,
        dob: new Date(tp.dob),
        language: tp.language,
        primaryDiagnosis: tp.primaryDiagnosis,
        createdBy: admin._id,
      });
      console.log(`✓ Patient ${tp.name} created`);
    } else {
      const existing = await Call.countDocuments({ organization: ORG, patient: patient._id });
      if (existing >= tp.severities.length) {
        console.log(`- ${tp.name} already has ${existing} calls, skipping`);
        continue;
      }
    }

    const existingCalls = await Call.find({ organization: ORG, patient: patient._id }).sort({ createdAt: 1 });
    const have = existingCalls.length;
    for (let i = have; i < tp.severities.length; i++) {
      const sev = tp.severities[i];
      const ageDays = (tp.severities.length - i) * 7;
      const createdAt = daysAgo(ageDays, 10 + i);
      await Call.create({
        direction: "outbound",
        organization: ORG,
        patient: patient._id,
        patientType: "human",
        startedBy: admin._id,
        status: "completed",
        duration: 240,
        aiSeverityScore: sev,
        triageTier: sev >= 8 ? 0 : sev >= 7 ? 1 : 2,
        highestTier: sev >= 8 ? 0 : sev >= 7 ? 1 : 2,
        aiSummary: tp.summaries[i] || `Severity ${sev}/10 follow-up`,
        aiRecommendations: sev >= 7 ? "Urgent clinic review within 24h" : "Routine follow-up",
        language: tp.language,
        patientResponded: true,
        startedAt: createdAt,
        endedAt: createdAt,
        createdAt,
      });
      created++;
    }
    console.log(`✓ ${tp.name}: ${tp.severities.length} escalating calls (${tp.severities.join("→")})`);
  }

  await mongoose.disconnect();
  console.log(`Done. Created ${created} risk-trend calls.`);
  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
