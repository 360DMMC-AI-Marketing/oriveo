import mongoose from "mongoose";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import Patient from "../models/Patient.js";
import User from "../models/User.js";
import LabResult from "../models/LabResult.js";
import Prescription from "../models/Prescription.js";
import CarePlan from "../models/CarePlan.js";
import HomeVisit from "../models/HomeVisit.js";
import Call from "../models/Call.js";
import CallEvent from "../models/CallEvent.js";
import Report from "../models/Report.js";
import AuditLog from "../models/AuditLog.js";
import Consent from "../models/Consent.js";
import Questionnaire from "../models/Questionnaire.js";
import ProviderSchedule from "../models/ProviderSchedule.js";
import BookingToken from "../models/BookingToken.js";
import Notification from "../models/Notification.js";
import Appointment from "../models/Appointment.js";

const MONGO_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/oriveo";
const ORG = "6a554f5f68ed3185349a78bf";

const daysAgo = (n) => new Date(Date.now() - n * 86400000);
const daysFromNow = (n, hour = 10) => {
  const d = daysFromNowBase(n);
  d.setHours(hour, 0, 0, 0);
  return d;
};
function daysFromNowBase(n) {
  const d = new Date(Date.now() + n * 86400000);
  d.setHours(9, 0, 0, 0);
  return d;
}
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const rn = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const rand = (a, b) => Math.random() * (b - a) + a;
const rdate = (start, end) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));

// ─── Demo datasets ─────────────────────────────────────────────

const DEMO_PATIENTS = [
  { name: "Alice Martin", patientType: "human", specialty: "cardiology", email: "amartin@email.com", phone: "+212600000001", gender: "female", dob: "1958-04-12", bloodType: "A+", language: "en", address: "12 Rue des Fleurs, Casablanca", emergencyContact: "Robert Martin", emergencyContactPhone: "+212611111111", insuranceId: "INS-7712", primaryDiagnosis: "Hypertension", chronicConditions: "Hypertension, Hyperlipidemia", allergies: "Penicillin", currentMedications: "Lisinopril 10mg, Atorvastatin 20mg", pastSurgeries: "Appendectomy (1998)", medicalNotes: "Monitor BP weekly", assignedDoctor: null },
  { name: "Fatima Zahra El Idrissi", patientType: "human", specialty: "endocrinology", email: "fz.elidrissi@email.com", phone: "+212600000002", gender: "female", dob: "1972-09-23", bloodType: "O+", language: "ar", address: "5 Avenue Hassan II, Rabat", emergencyContact: "Youssef El Idrissi", emergencyContactPhone: "+212622222222", insuranceId: "INS-8833", primaryDiagnosis: "Type 2 Diabetes", chronicConditions: "T2DM, Diabetic neuropathy", allergies: "Sulfa drugs", currentMedications: "Metformin 500mg BID", pastSurgeries: "C-section (2005)", medicalNotes: "HbA1c target <7", assignedDoctor: null },
  { name: "Daniel O'Connor", patientType: "human", specialty: "orthopedics", email: "doconnor@email.com", phone: "+212600000003", gender: "male", dob: "1985-01-30", bloodType: "O-", language: "en", address: "34 King St, Tanger", emergencyContact: "Mary O'Connor", emergencyContactPhone: "+212633333333", insuranceId: "INS-9944", primaryDiagnosis: "Post-op ACL reconstruction", chronicConditions: "None", allergies: "None", currentMedications: "Ibuprofen 600mg PRN", pastSurgeries: "ACL reconstruction (2026)", medicalNotes: "Physio 3x weekly", assignedDoctor: null },
  { name: "Sofia Benali", patientType: "human", specialty: "pediatrics", email: "sbenali@email.com", phone: "+212600000004", gender: "female", dob: "2019-06-15", bloodType: "B+", language: "ar", address: "18 Rue du Marché, Fès", emergencyContact: "Leila Benali", emergencyContactPhone: "+212644444444", insuranceId: "INS-1010", primaryDiagnosis: "Well-child", chronicConditions: "None", allergies: "None", currentMedications: "None", pastSurgeries: "None", medicalNotes: "Growth on track", assignedDoctor: null },
  { name: "George Hamilton", patientType: "human", specialty: "dentistry", email: "ghamilton@email.com", phone: "+212600000005", gender: "male", dob: "1964-11-02", bloodType: "A-", language: "en", address: "9 Park Lane, Marrakech", emergencyContact: "Jane Hamilton", emergencyContactPhone: "+212655555555", insuranceId: "INS-1122", primaryDiagnosis: "Periodontitis", chronicConditions: "None", allergies: "Latex", currentMedications: "None", pastSurgeries: "Root canal (2024)", medicalNotes: "Recall in 6 months", assignedDoctor: null },
  { name: "Hana Yoshida", patientType: "human", specialty: "general", email: "hyoshida@email.com", phone: "+212600000006", gender: "female", dob: "1990-03-08", bloodType: "AB+", language: "en", address: "22 Rue Verte, Agadir", emergencyContact: "Ken Yoshida", emergencyContactPhone: "+212666666666", insuranceId: "INS-1233", primaryDiagnosis: "Seasonal allergies", chronicConditions: "Asthma", allergies: "Dust mites", currentMedications: "Albuterol inhaler PRN", pastSurgeries: "None", medicalNotes: "Review inhaler technique", assignedDoctor: null },
  { name: "Mahmoud Ait Taleb", patientType: "human", specialty: "cardiology", email: "maittal@email.com", phone: "+212600000007", gender: "male", dob: "1950-12-19", bloodType: "O+", language: "ar", address: "3 Rue de la Gare, Oujda", emergencyContact: "Samira Ait Taleb", emergencyContactPhone: "+212677777777", insuranceId: "INS-1344", primaryDiagnosis: "Heart failure (NYHA II)", chronicConditions: "HF, AFib, HTN", allergies: "Aspirin", currentMedications: "Metoprolol 25mg, Furosemide 40mg", pastSurgeries: "CABG (2019)", medicalNotes: "Weight daily", assignedDoctor: null },
  { name: "Chloe Dubois", patientType: "human", specialty: "general", email: "cdubois@email.com", phone: "+212600000008", gender: "female", dob: "1995-08-27", bloodType: "B-", language: "fr", address: "15 Rue Pasteur, Tétouan", emergencyContact: "Marc Dubois", emergencyContactPhone: "+212688888888", insuranceId: "INS-1455", primaryDiagnosis: "Migraine", chronicConditions: "None", allergies: "Codeine", currentMedications: "Sumatriptan PRN", pastSurgeries: "None", medicalNotes: "Keep headache diary", assignedDoctor: null },
  { name: "Rocky", patientType: "pet", specialty: "veterinary", email: "rocky.owner@email.com", phone: "+212600000009", gender: "neutered", species: "Dog", breed: "Labrador Retriever", weight: 32, color: "Yellow", microchipId: "982000364789012", ownerName: "Peter Stone", ownerPhone: "+212699999999", ownerEmail: "pstone@email.com", primaryDiagnosis: "Arthritis", chronicConditions: "Hip dysplasia", allergies: "None", currentMedications: "Meloxicam 7.5mg daily", medicalNotes: "Weight management", assignedDoctor: null },
  { name: "Whiskers", patientType: "pet", specialty: "veterinary", email: "whiskers.owner@email.com", phone: "+212600000010", gender: "spayed", species: "Cat", breed: "British Shorthair", weight: 5.2, color: "Blue Grey", microchipId: "982000364789013", ownerName: "Emma Clarke", ownerPhone: "+212600000010", ownerEmail: "eclarke@email.com", primaryDiagnosis: "Chronic kidney disease", chronicConditions: "CKD Stage 2", allergies: "None", currentMedications: "Renal diet", medicalNotes: "Encourage water intake", assignedDoctor: null },
  { name: "Tweety", patientType: "pet", specialty: "veterinary", email: "tweety.owner@email.com", phone: "+212600000011", gender: "intact-female", species: "Bird", breed: "Budgerigar", weight: 0.04, color: "Green/Yellow", microchipId: "", ownerName: "Nora Adams", ownerPhone: "+212600000011", ownerEmail: "nora@email.com", primaryDiagnosis: "Feather plucking", chronicConditions: "None", allergies: "None", currentMedications: "None", medicalNotes: "Enrichment needed", assignedDoctor: null },
  { name: "Oreo", patientType: "pet", specialty: "veterinary", email: "oreo.owner@email.com", phone: "+212600000012", gender: "intact-male", species: "Rabbit", breed: "Mini Lop", weight: 2.1, color: "Black/White", microchipId: "982000364789014", ownerName: "Lucas Green", ownerPhone: "+212600000012", ownerEmail: "lgreen@email.com", primaryDiagnosis: "Dental malocclusion", chronicConditions: "None", allergies: "None", currentMedications: "None", medicalNotes: "Diet high in hay", assignedDoctor: null },
];

const LAB_PANELS = {
  "CBC": { loinc: "58410-2", tests: [
    { name: "WBC", loinc: "6690-2", unit: "x10^9/L", low: "4.5", high: "11.0" },
    { name: "RBC", loinc: "789-8", unit: "x10^12/L", low: "4.5", high: "5.9" },
    { name: "Hemoglobin", loinc: "718-7", unit: "g/dL", low: "13.5", high: "17.5" },
    { name: "Hematocrit", loinc: "4544-3", unit: "%", low: "41", high: "53" },
    { name: "Platelets", loinc: "777-3", unit: "x10^9/L", low: "150", high: "400" },
  ]},
  "CMP": { loinc: "24323-8", tests: [
    { name: "Glucose", loinc: "2345-7", unit: "mg/dL", low: "70", high: "99" },
    { name: "BUN", loinc: "3094-0", unit: "mg/dL", low: "7", high: "20" },
    { name: "Creatinine", loinc: "2160-0", unit: "mg/dL", low: "0.7", high: "1.3" },
    { name: "Sodium", loinc: "2951-2", unit: "mmol/L", low: "135", high: "145" },
    { name: "Potassium", loinc: "2823-3", unit: "mmol/L", low: "3.5", high: "5.0" },
    { name: "ALT", loinc: "1742-6", unit: "U/L", low: "7", high: "56" },
  ]},
  "Lipid Panel": { loinc: "24331-1", tests: [
    { name: "Total Cholesterol", loinc: "2093-3", unit: "mg/dL", low: "", high: "200" },
    { name: "LDL Cholesterol", loinc: "13457-7", unit: "mg/dL", low: "", high: "100" },
    { name: "HDL Cholesterol", loinc: "2086-7", unit: "mg/dL", low: "40", high: "" },
    { name: "Triglycerides", loinc: "2571-8", unit: "mg/dL", low: "", high: "150" },
  ]},
  "HbA1c": { loinc: "4548-4", tests: [
    { name: "HbA1c", loinc: "4548-4", unit: "%", low: "", high: "5.7" },
  ]},
  "Thyroid Panel": { loinc: "34542-5", tests: [
    { name: "TSH", loinc: "3016-3", unit: "mIU/L", low: "0.4", high: "4.0" },
    { name: "Free T4", loinc: "3024-7", unit: "ng/dL", low: "0.8", high: "1.8" },
  ]},
  "Urinalysis": { loinc: "24357-6", tests: [
    { name: "Specific Gravity", unit: "", low: "1.003", high: "1.030" },
    { name: "pH", unit: "", low: "4.5", high: "8.0" },
    { name: "Protein", unit: "mg/dL", low: "0", high: "30" },
    { name: "Glucose", unit: "", low: "Negative", high: "Negative" },
    { name: "WBC", unit: "per HPF", low: "0", high: "5" },
  ]},
};

const PRESCRIPTION_TEMPLATES = [
  { medication: "Lisinopril", dosage: "10 mg", route: "oral", frequency: "Once daily", instructions: "Take in the morning", quantity: 90, refills: 3 },
  { medication: "Metformin", dosage: "500 mg", route: "oral", frequency: "Twice daily", instructions: "Take with meals", quantity: 120, refills: 3 },
  { medication: "Amoxicillin", dosage: "500 mg", route: "oral", frequency: "Three times daily", instructions: "Complete full course, 7 days", quantity: 21, refills: 0 },
  { medication: "Atorvastatin", dosage: "20 mg", route: "oral", frequency: "Once daily", instructions: "Take at bedtime", quantity: 90, refills: 3 },
  { medication: "Metoprolol Succinate", dosage: "25 mg", route: "oral", frequency: "Once daily", instructions: "Take at same time daily", quantity: 30, refills: 2 },
  { medication: "Levothyroxine", dosage: "75 mcg", route: "oral", frequency: "Once daily", instructions: "Take 30 min before breakfast", quantity: 90, refills: 3 },
  { medication: "Albuterol Inhaler", dosage: "90 mcg", route: "inhalation", frequency: "As needed", instructions: "2 puffs every 4-6h for wheezing", quantity: 1, refills: 2 },
  { medication: "Gabapentin", dosage: "300 mg", route: "oral", frequency: "Three times daily", instructions: "Neuropathic pain", quantity: 90, refills: 1 },
  { medication: "Hydrochlorothiazide", dosage: "25 mg", route: "oral", frequency: "Once daily", instructions: "Take in the morning", quantity: 30, refills: 3 },
  { medication: "Sertraline", dosage: "50 mg", route: "oral", frequency: "Once daily", instructions: "Take with food", quantity: 30, refills: 3 },
  { medication: "Pantoprazole", dosage: "40 mg", route: "oral", frequency: "Once daily", instructions: "Before breakfast", quantity: 30, refills: 2 },
  { medication: "Ibuprofen", dosage: "600 mg", route: "oral", frequency: "Three times daily PRN", instructions: "Take with food for pain", quantity: 60, refills: 1 },
  { medication: "Ciprofloxacin", dosage: "500 mg", route: "oral", frequency: "Twice daily", instructions: "Finish entire course", quantity: 20, refills: 0 },
  { medication: "Omeprazole", dosage: "20 mg", route: "oral", frequency: "Once daily", instructions: "30 min before meals", quantity: 30, refills: 2 },
  { medication: "Prednisone", dosage: "10 mg", route: "oral", frequency: "Once daily", instructions: "Taper per schedule", quantity: 21, refills: 0 },
  { medication: "Meloxicam", dosage: "7.5 mg", route: "oral", frequency: "Once daily", instructions: "Give with food (pet)", quantity: 30, refills: 3 },
  { medication: "Cosequin Joint Supplement", dosage: "1 chew", route: "oral", frequency: "Once daily", instructions: "Joint support (pet)", quantity: 60, refills: 2 },
  { medication: "Tramadol", dosage: "50 mg", route: "oral", frequency: "Every 6 hours PRN", instructions: "Moderate pain", quantity: 40, refills: 1 },
];

const CALL_SUMMARIES = [
  { sev: 8, tier: 0, summary: "Patient reports crushing chest pain radiating to the left arm with shortness of breath. EMERGENCY PROTOCOL ACTIVATED. Advised immediate ER evaluation.", rec: "Immediate medical attention required. Advise ER or 911.", red: [{ tier: 0, keyword: "chest pain", text: "Emergency keyword detected", crisis: false }, { tier: 1, keyword: "shortness of breath", text: "Urgent concern noted", crisis: false }], concern: "It hurts when I breathe and my arm is numb." },
  { sev: 9, tier: 0, summary: "Patient expressed suicidal thoughts and hopelessness during check-in. Crisis pathway engaged. 988 Lifeline provided and clinic notified.", rec: "Activate crisis protocol. Contact clinic and emergency services immediately.", red: [{ tier: 0, keyword: "suicidal thoughts", text: "Crisis keyword detected", crisis: true }], concern: "I don't want to be here anymore." },
  { sev: 7, tier: 0, summary: "Elderly patient with acute confusion, fever and altered mental status. Possible infection/sepsis. Urgent evaluation recommended.", rec: "High priority — urgent clinic or ED evaluation within the hour.", red: [{ tier: 0, keyword: "altered mental status", text: "High-risk finding", crisis: false }], concern: "My mother is confused and has a high fever." },
  { sev: 6, tier: 1, summary: "Diabetic patient with foot numbness and an open wound. Screened for neuropathy. Podiatry follow-up recommended.", rec: "Schedule podiatry follow-up within 24-48 hours.", red: [{ tier: 2, keyword: "foot numbness", text: "Routine flag", crisis: false }], concern: "My foot feels numb and has a sore." },
  { sev: 5, tier: 2, summary: "Asthmatic patient reporting increased inhaler use due to pollen season. Reviewed trigger avoidance.", rec: "Allergy consult and inhaler technique review.", red: [], concern: "Using my inhaler every day this week." },
  { sev: 4, tier: 2, summary: "Post-op follow-up. Surgical site healing well, no signs of infection. Sutures to be removed in 5 days.", rec: "Continue wound care, remove sutures in 5 days.", red: [], concern: "Feeling much better, no pain." },
  { sev: 3, tier: 3, summary: "Well-child checkup. Parent reports no concerns. Growth on track, vaccinations up to date.", rec: "Routine. Next well visit in 6 months.", red: [], concern: "Everything seems fine." },
  { sev: 2, tier: 3, summary: "Medication refill request for hypertension. BP well controlled on current regimen.", rec: "Refill authorized for 90 days. Recheck BP in 3 months.", red: [], concern: "Just need a refill." },
  { sev: 6, tier: 1, summary: "Patient with severe migraine lasting 3 days not responding to usual treatment. Neurology referral recommended.", rec: "Urgent neurology referral.", red: [{ tier: 1, keyword: "migraine", text: "Urgent concern noted", crisis: false }], concern: "Worst headache of my life." },
  { sev: 7, tier: 0, summary: "Respiratory symptoms with fever >39C for 2 days. Possible pneumonia. Advised ED evaluation.", rec: "ED evaluation for possible pneumonia.", red: [{ tier: 0, keyword: "high fever", text: "Emergency keyword detected", crisis: false }], concern: "Can't stop coughing and have a high fever." },
];

const AUDIT_ACTIONS = [
  "patient.viewed", "patient.updated", "patient.created", "call.viewed", "call.transcript.viewed",
  "call.recorded", "call.transferred", "ehr.synced", "ehr.exported", "settings.changed",
  "user.login", "user.logout", "api.access",
];
const AUDIT_DESC = {
  "patient.viewed": "Viewed patient medical record",
  "patient.updated": "Updated patient demographics",
  "patient.created": "Created new patient record",
  "call.viewed": "Reviewed call transcript and AI summary",
  "call.transcript.viewed": "Downloaded full transcript of call",
  "call.recorded": "Call recording saved to storage",
  "call.transferred": "Call transferred to human provider",
  "ehr.synced": "Synchronized clinical data with EHR",
  "ehr.exported": "Exported patient summary for referral",
  "settings.changed": "Updated clinic notification settings",
  "user.login": "User logged in",
  "user.logout": "User logged out",
  "api.access": "API access — reports/generate",
};

const EVENT_TYPES = ["transcript", "triage", "emotion", "state_change", "language_detected", "transfer", "error"];

// ─── Helpers ────────────────────────────────────────────────

function makeTests(panelName, overrides) {
  const panel = LAB_PANELS[panelName];
  return panel.tests.map((t) => {
    const base = { name: t.name, loinc: t.loinc || "", unit: t.unit, referenceLow: t.low, referenceHigh: t.high, note: "" };
    const ov = (overrides && overrides[t.name]) || null;
    if (ov) return { ...base, ...ov };
    const roll = Math.random();
    if (roll < 0.08) return { ...base, value: String(rn(2, 8)), status: "pending" };
    const lowN = Number(t.low);
    const highN = Number(t.high);
    const numeric = !Number.isNaN(lowN) && !Number.isNaN(highN) && t.low !== "" && t.high !== "";
    return {
      ...base,
      value: numeric ? String(rand(lowN, highN).toFixed(numeric && highN - lowN < 5 ? 2 : 1)) : String(rn(1, 100)),
      status: "normal",
    };
  });
}

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB");

  const db = mongoose.connection.db;
  const admin = await User.findOne({ email: "anassamiri87@gmail.com" });
  const sarah = await User.findOne({ email: "sarah@demo-clinic.com" });
  const karim = await User.findOne({ email: "karim@demo-clinic.com" });
  const fatima = await User.findOne({ email: "fatima@demo-clinic.com" });
  if (!admin || !sarah || !karim) throw new Error("Required org users not found — run seed-minimal first");
  const admins = [admin._id, sarah._id, karim._id];
  const staff = [admin._id, sarah._id, karim._id, fatima?._id].filter(Boolean);

  // ── 1. Caregiver user ────────────────────────────────────
  let caregiver = await User.findOne({ email: "caregiver@demo-clinic.com" });
  if (!caregiver) {
    caregiver = await User.create({ name: "Omar El Amrani", email: "caregiver@demo-clinic.com", password: "test1234", role: "caregiver", organization: admin.organization, phone: "+212677123456" });
    console.log("✓ Created caregiver:", caregiver.email);
  } else {
    console.log("✓ Caregiver already exists:", caregiver.email);
  }
  const caregiverId = caregiver._id;

  // ── 2. Patients ──────────────────────────────────────────
  let patients = await Patient.find({ organization: admin.organization });
  console.log(`Found ${patients.length} existing patients`);

  const existingEmails = new Set(patients.map((p) => (p.email || "").toLowerCase()));
  const newPatientDocs = [];
  for (const dp of DEMO_PATIENTS) {
    if (existingEmails.has(dp.email.toLowerCase())) continue;
    const assigned = dp.specialty === "veterinary" ? sarah._id : karim._id;
    newPatientDocs.push({
      ...dp,
      organization: admin.organization,
      dob: new Date(dp.dob),
      createdBy: admin._id,
      assignedDoctor: assigned,
      lastCheckupDate: daysAgo(rn(10, 90)),
      nextScheduledDate: daysFromNow(rn(1, 30)),
      isActive: true,
      reminderPreferences: { email: true },
    });
  }
  if (newPatientDocs.length) {
    await Patient.create(newPatientDocs);
    console.log(`✓ Created ${newPatientDocs.length} new patients`);
  }

  // Enrich existing patients (specialty, assigned doctor, dates)
  patients = await Patient.find({ organization: admin.organization });
  let enriched = 0;
  for (const p of patients) {
    let need = false;
    if (!p.specialty) { p.specialty = p.patientType === "pet" ? "veterinary" : "general"; need = true; }
    if (!p.lastCheckupDate) { p.lastCheckupDate = daysAgo(rn(10, 90)); need = true; }
    if (!p.nextScheduledDate) { p.nextScheduledDate = daysFromNow(rn(1, 30)); need = true; }
    if (!p.assignedDoctor) { p.assignedDoctor = pick(admins); need = true; }
    if (need) { await p.save(); enriched++; }
  }
  console.log(`✓ Enriched ${enriched} existing patients`);

  // Portal enable
  const portalPatients = await Patient.find({ organization: admin.organization, email: { $in: ["jwilson@email.com", "mgarcia@email.com", "rocky.owner@email.com"] } });
  for (const p of portalPatients) {
    if (!p.portalEnabled) {
      p.portalEnabled = true;
      p.portalPassword = await bcrypt.hash("test1234", 10);
      await p.save();
      console.log(`✓ Portal enabled for ${p.name}`);
    }
  }

  patients = await Patient.find({ organization: admin.organization });
  const humanPatients = patients.filter((p) => p.patientType !== "pet");
  const petPatients = patients.filter((p) => p.patientType === "pet");

  // ── 3. Lab results ───────────────────────────────────────
  await LabResult.deleteMany({ organization: admin.organization });
  const labBatch = [];
  const labPanels = Object.keys(LAB_PANELS);
  for (let i = 0; i < 16; i++) {
    const patient = pick(humanPatients);
    const panel = labPanels[i % labPanels.length];
    const overrides = {};
    if (i % 4 === 0 && panel === "CBC") { overrides["Hemoglobin"] = { value: "9.2", status: "low" }; overrides["WBC"] = { value: "16.5", status: "high" }; }
    if (i % 5 === 0 && panel === "CMP") { overrides["Glucose"] = { value: "182", status: "high" }; overrides["Potassium"] = { value: "2.9", status: "low" }; }
    if (i % 7 === 0 && panel === "HbA1c") { overrides["HbA1c"] = { value: "8.9", status: "critical" }; }
    if (i % 6 === 0 && panel === "Lipid Panel") { overrides["LDL Cholesterol"] = { value: "165", status: "high" }; }
    if (i % 9 === 0 && panel === "Thyroid Panel") { overrides["TSH"] = { value: "12.4", status: "high" }; }
    const status = i % 10 === 0 ? "in-progress" : i % 13 === 0 ? "ordered" : i % 11 === 0 ? "cancelled" : "completed";
    labBatch.push({
      organization: admin.organization,
      patient: patient._id,
      orderedBy: pick(admins),
      panel,
      status,
      orderedAt: daysAgo(rn(1, 90)),
      collectedAt: status === "completed" || status === "in-progress" ? daysAgo(rn(1, 89)) : null,
      completedAt: status === "completed" ? daysAgo(rn(1, 89)) : null,
      tests: status === "completed" || status === "in-progress" ? makeTests(panel, overrides) : [],
      notes: i % 8 === 0 ? "Fasting sample" : "",
    });
  }
  await LabResult.insertMany(labBatch);
  console.log(`✓ Created ${labBatch.length} lab results`);

  // ── 4. Prescriptions ─────────────────────────────────────
  await Prescription.deleteMany({ organization: admin.organization });
  const rxBatch = [];
  for (let i = 0; i < 18; i++) {
    const patient = pick(i < 16 ? humanPatients : petPatients);
    const tpl = PRESCRIPTION_TEMPLATES[i % PRESCRIPTION_TEMPLATES.length];
    const status = i % 10 === 0 ? "filled" : i % 7 === 0 ? "expired" : i % 9 === 0 ? "cancelled" : i % 11 === 0 ? "completed" : "active";
    const signed = status !== "cancelled" && Math.random() > 0.15;
    rxBatch.push({
      organization: admin.organization,
      patient: patient._id,
      prescribedBy: pick(admins),
      createdBy: pick(admins),
      ...tpl,
      startDate: daysAgo(rn(0, 60)),
      endDate: status === "expired" ? daysAgo(rn(1, 10)) : status === "completed" ? daysAgo(rn(1, 5)) : daysFromNow(rn(30, 90)),
      status,
      isSigned: signed,
      signedBy: signed ? pick(admins) : null,
      signedAt: signed ? daysAgo(rn(1, 30)) : null,
      signatureName: "Dr. Sarah Johnson",
    });
  }
  await Prescription.insertMany(rxBatch);
  console.log(`✓ Created ${rxBatch.length} prescriptions`);

  // ── 5. Home care ─────────────────────────────────────────
  await CarePlan.deleteMany({ organization: admin.organization });
  await HomeVisit.deleteMany({ organization: admin.organization });

  let carePlanDocs = [];
  const carePoolArr = [...humanPatients, ...petPatients];
  for (let i = 0; i < 7; i++) {
    const patient = carePoolArr[i % carePoolArr.length];
    const isPet = patient.patientType === "pet";
    const status = i % 6 === 0 ? "paused" : i % 5 === 0 ? "completed" : i % 9 === 0 ? "cancelled" : "active";
    const tasks = [
      { title: isPet ? "Administer medication" : "Morning medication", frequency: "daily", dueDate: daysFromNow(0), completed: i % 3 !== 0, completedAt: i % 3 !== 0 ? daysAgo(rn(0, 2)) : null, completedBy: i % 3 !== 0 ? caregiverId : null },
      { title: isPet ? "Check food and water" : "Check vitals", frequency: "daily", dueDate: daysFromNow(0), completed: i % 2 === 0, completedAt: i % 2 === 0 ? daysAgo(rn(0, 1)) : null, completedBy: i % 2 === 0 ? caregiverId : null },
      { title: isPet ? "Walk" : "Range of motion exercises", frequency: "weekly", dueDate: daysFromNow(2), completed: false },
      { title: isPet ? "Grooming" : "Prepare meals", frequency: "weekly", dueDate: daysFromNow(4), completed: false },
    ];
    const medications = isPet
      ? [{ name: "Meloxicam", dose: "7.5 mg", frequency: "daily", instructions: "With food" }]
      : [
        { name: "Lisinopril", dose: "10 mg", frequency: "daily", instructions: "Morning" },
        { name: "Atorvastatin", dose: "20 mg", frequency: "daily", instructions: "Night" },
      ];
    carePlanDocs.push({
      organization: admin.organization,
      patient: patient._id,
      caregiver: caregiverId,
      title: isPet ? `${patient.name} Home Care` : `Home Care — ${patient.name}`,
      description: isPet ? "Daily care and mobility support" : "Post-discharge recovery and daily monitoring",
      status,
      startDate: daysAgo(rn(5, 60)),
      endDate: status === "completed" ? daysAgo(rn(1, 10)) : status === "cancelled" ? daysAgo(rn(1, 10)) : daysFromNow(45),
      tasks,
      medications,
      emergencyContacts: isPet ? [patient.ownerName || "Owner", patient.ownerPhone || patient.phone] : [patient.emergencyContact || "Family member", patient.emergencyContactPhone || patient.phone],
      notes: "Monitor and report any changes promptly",
      createdBy: admin._id,
    });
  }
  carePlanDocs = await CarePlan.insertMany(carePlanDocs);
  console.log(`✓ Created ${carePlanDocs.length} care plans`);

  const visitBatch = [];
  for (let i = 0; i < 14; i++) {
    const plan = carePlanDocs[i % carePlanDocs.length];
    const patient = plan.patient;
    const status = i % 4 === 0 ? "scheduled" : i % 5 === 0 ? "in-progress" : i % 9 === 0 ? "cancelled" : "completed";
    const completed = status === "completed";
    const hasVitals = completed || status === "in-progress";
    visitBatch.push({
      organization: admin.organization,
      patient,
      caregiver: caregiverId,
      carePlan: plan._id,
      scheduledAt: completed ? daysAgo(rn(1, 30)) : i % 4 === 0 ? daysFromNow(rn(1, 5)) : daysFromNow(0),
      status,
      checkInAt: hasVitals ? (completed ? daysAgo(rn(1, 30)) : daysFromNow(0)) : null,
      checkOutAt: completed ? daysAgo(rn(1, 30)) : null,
      geoCheckIn: { lat: Number(rand(33.5, 34.3).toFixed(5)), lng: Number(rand(-7.7, -5.5).toFixed(5)), address: "Patient home address" },
      vitals: hasVitals ? { bloodPressure: "128/82", heartRate: rn(64, 92), temperature: Number(rand(36.4, 37.2).toFixed(1)), spo2: rn(95, 99), weight: Number(rand(60, 95).toFixed(1)), painScore: completed ? rn(0, 3) : null, notes: "" } : {},
      soap: completed ? {
        subjective: "Patient reports feeling stable, good appetite",
        objective: `Vitals within normal range. Heart rate ${rn(64, 92)} bpm.`,
        assessment: "Stable, recovery on track",
        plan: "Continue care plan; reassess next visit",
      } : {},
      tasksCompleted: completed ? ["Morning medication", "Check vitals"] : [],
      billableCodes: completed ? ["RPM", "CCM"] : [],
      notes: completed ? "Visit completed successfully" : "",
      createdBy: admin._id,
    });
  }
  await HomeVisit.insertMany(visitBatch);
  console.log(`✓ Created ${visitBatch.length} home visits`);

  // Family link (BookingToken) for one care plan
  const familyPatient = carePlanDocs[0].patient;
  const familyToken = crypto.randomBytes(24).toString("hex");
  await BookingToken.create({ patient: familyPatient, organization: admin.organization, token: familyToken, expiresAt: daysFromNow(30) });
  console.log(`✓ Family link: /family/${familyToken}`);

  // ── 6. Calls & emergencies ───────────────────────────────
  const existingCalls = await Call.find({ organization: admin.organization });
  let enrichedCalls = 0;
  const emergencyIdx = new Set([0, 3, 5]);
  for (let i = 0; i < existingCalls.length; i++) {
    const call = existingCalls[i];
    const tpl = CALL_SUMMARIES[i % CALL_SUMMARIES.length];
    const isEmergency = emergencyIdx.has(i % 6) || tpl.sev >= 7;
    const status = i % 8 === 0 ? "failed" : i % 9 === 0 ? "cancelled" : i % 7 === 0 ? "scheduled" : i % 6 === 0 ? "in-progress" : "completed";
    const qa = { accuracy: rn(70, 98), empathy: rn(75, 95), professionalism: rn(80, 99), adherence: rn(70, 95), resolution: rn(60, 90), overall: rn(70, 95) };
    const set = {
      aiSeverityScore: tpl.sev,
      triageTier: tpl.tier,
      highestTier: Math.max(tpl.tier, call.highestTier || tpl.tier),
      aiSummary: tpl.summary,
      aiRecommendations: tpl.rec,
      status,
      duration: status === "completed" ? rn(90, 540) : call.duration || 0,
      transcript: [
        { question: "Hello, this is Oriveo calling from your clinic. How are you feeling today?", answer: tpl.sev >= 7 ? "Not well at all" : "I'm okay", timestamp: 5 },
        { question: "Can you describe what symptoms you're experiencing?", answer: tpl.concern, timestamp: 30 },
        { question: "How long have you had these symptoms?", answer: pick(["Since yesterday", "About 3 days", "Almost a week"]), timestamp: 60 },
        { question: "On a scale of 1-10, how severe is this for you?", answer: tpl.sev >= 7 ? String(rn(8, 10)) : String(rn(2, 5)), timestamp: 90 },
      ],
      emotionalState: { primary: pick(["neutral", "anxious", "concerned", "distressed"]), intensity: isEmergency ? rn(7, 9) : rn(1, 5), painLevel: tpl.sev >= 7 ? "severe" : pick([null, null, "mild", "moderate"]) },
      redFlags: tpl.red || [],
      concerningStatements: tpl.sev >= 7 ? [{ text: tpl.concern, timestamp: rn(20, 90), flags: ["pain", "distress"] }] : [],
      emergencyDetected: isEmergency,
      emergencyType: isEmergency ? (tpl.tier === 0 && i % 2 === 0 ? "medical" : "crisis") : null,
      emergencyActionTaken: isEmergency && i % 2 === 0 ? (i % 4 === 0 ? "called_911" : "called_clinic") : "none",
      emergencyConfirmedBy: isEmergency && i % 2 === 0 ? admin._id : null,
      emergencyCalledAt: isEmergency && i % 2 === 0 ? daysAgo(rn(0, 7)) : null,
      language: pick(["en", "en", "en", "fr", "ar"]),
      patientResponded: status !== "failed",
      qaScore: status === "completed" ? { scores: { accuracy: qa.accuracy, empathy: qa.empathy, professionalism: qa.professionalism, adherence: qa.adherence, resolution: qa.resolution }, overall: qa.overall, strengths: ["Accurate assessment", "Compassionate tone"], weaknesses: [], summary: `QA Score — ${isEmergency ? "Emergency" : "Routine"} call handled appropriately.`, scoredAt: daysAgo(rn(1, 7)) } : null,
    };
    await Call.updateOne({ _id: call._id }, { $set: set });
    enrichedCalls++;
  }
  console.log(`✓ Enriched ${enrichedCalls} existing calls (incl. emergencies)`);

  const newCalls = [];
  const newEmergencyTpl = CALL_SUMMARIES[1];
  newCalls.push({
    direction: "inbound", organization: admin.organization, patient: pick(humanPatients)._id, patientType: "human",
    startedBy: admin._id, status: "completed", duration: 320,
    aiSeverityScore: 9, triageTier: 0, highestTier: 0,
    aiSummary: newEmergencyTpl.summary, aiRecommendations: newEmergencyTpl.rec,
    emergencyDetected: true, emergencyType: "crisis", emergencyActionTaken: "called_911", emergencyConfirmedBy: admin._id, emergencyCalledAt: daysAgo(1),
    transcript: [
      { question: "What's going on?", answer: "I'm feeling really hopeless", timestamp: 5 },
      { question: "Have you had any thoughts of harming yourself?", answer: "Yes", timestamp: 20 },
    ],
    redFlags: [{ tier: 0, keyword: "suicidal thoughts", text: "Crisis keyword detected", crisis: true }],
    concerningStatements: [{ text: "I'm feeling really hopeless", timestamp: 5, flags: ["crisis"] }],
    crisisPathwayUsed: true, qaScore: { overall: 88, scores: { accuracy: 90, empathy: 92, professionalism: 95, adherence: 88, resolution: 80 }, strengths: ["Crisis handling"], weaknesses: [], summary: "Crisis call handled appropriately", scoredAt: daysAgo(1) },
    startedAt: daysAgo(1), endedAt: daysAgo(1), createdAt: daysAgo(1),
  });
  newCalls.push({
    direction: "outbound", organization: admin.organization, patient: pick(humanPatients)._id, patientType: "human",
    startedBy: sarah._id, status: "in-progress", duration: 0, aiSeverityScore: 7, triageTier: 1, highestTier: 1,
    aiSummary: "High-severity call currently in progress — patient reporting chest tightness.", aiRecommendations: "Monitor closely",
    emergencyDetected: false, emergencyActionTaken: "none", startedAt: daysFromNow(0), createdAt: daysFromNow(0),
    transcript: [], redFlags: [], concerningStatements: [], patientResponded: true,
  });
  newCalls.push({
    direction: "outbound", organization: admin.organization, patient: pick(humanPatients)._id, patientType: "human",
    startedBy: karim._id, status: "scheduled", scheduledAt: daysFromNow(1, 14), aiSeverityScore: 3, triageTier: 3, highestTier: 3,
    aiSummary: "Scheduled wellness check", aiRecommendations: "", emergencyDetected: false, emergencyActionTaken: "none",
    transcript: [], redFlags: [], concerningStatements: [], createdAt: daysFromNow(0),
  });
  for (let i = 0; i < 3; i++) {
    const tpl = CALL_SUMMARIES[4 + i];
    newCalls.push({
      direction: "outbound", organization: admin.organization, patient: pick(humanPatients)._id, patientType: "human",
      startedBy: pick(admins), status: "completed", duration: rn(120, 400),
      aiSeverityScore: tpl.sev, triageTier: tpl.tier, highestTier: tpl.tier, aiSummary: tpl.summary, aiRecommendations: tpl.rec,
      emergencyDetected: false, emergencyActionTaken: "none", redFlags: tpl.red || [], concerningStatements: [],
      qaScore: { overall: rn(78, 94), scores: { accuracy: rn(78, 95), empathy: rn(80, 94), professionalism: rn(82, 98), adherence: rn(80, 95), resolution: rn(70, 90) }, strengths: ["Clear communication"], weaknesses: [], summary: "Routine call handled well", scoredAt: daysAgo(rn(1, 10)) },
      startedAt: daysAgo(rn(1, 10)), endedAt: daysAgo(rn(1, 10)), createdAt: daysAgo(rn(1, 10)),
    });
  }
  await Call.insertMany(newCalls);
  console.log(`✓ Created ${newCalls.length} new calls`);

  const allCalls = await Call.find({ organization: admin.organization });
  await CallEvent.deleteMany({ organization: admin.organization });
  const eventBatch = [];
  for (const call of allCalls) {
    const count = rn(4, 7);
    for (let i = 0; i < count; i++) {
      const type = EVENT_TYPES[i % EVENT_TYPES.length];
      const dataMap = {
        transcript: { text: pick(["Patient reported symptoms", "Follow-up question asked", "Patient confirmed understanding"]), turn: i },
        triage: { tier: call.triageTier ?? 3, level: call.emergencyDetected ? "emergency" : pick(["urgent", "routine", "stable"]), keyword: call.emergencyDetected ? "emergency" : "cough" },
        emotion: { primary: call.emotionalState?.primary || "neutral", intensity: call.emotionalState?.intensity || rn(1, 5), painLevel: call.emotionalState?.painLevel || null },
        state_change: { from: "in-progress", to: call.status || "completed", reason: "Normal flow" },
        language_detected: { language: call.language || "en", confidence: Number(rand(0.8, 0.99).toFixed(2)) },
        transfer: { reason: "Patient requested human", target: pick(["doctor", "nurse"]), successful: true },
        error: { code: "STT_FAILURE", message: "Service temporarily unavailable", recovered: true },
      };
      eventBatch.push({
        organization: admin.organization,
        callId: call._id,
        type,
        data: dataMap[type] || {},
        timestamp: rdate(daysAgo(14), daysFromNow(0)),
      });
    }
  }
  await CallEvent.insertMany(eventBatch);
  console.log(`✓ Created ${eventBatch.length} call events`);

  // ── 7. Reports ───────────────────────────────────────────
  await Report.deleteMany({ organization: admin.organization });
  const completedCalls = allCalls.filter((c) => c.status === "completed" && c.aiSummary).slice(0, 12);
  const reportBatch = [];
  for (const call of completedCalls) {
    const patient = await Patient.findById(call.patient);
    reportBatch.push({
      call: call._id,
      patient: call.patient,
      organization: admin.organization,
      generatedBy: call.startedBy || admin._id,
      specialty: "general-practice",
      clinicType: "human",
      patientInfo: { name: patient?.name || "Patient", age: patient?.dob ? rn(20, 80) : null, gender: patient?.gender || "", phone: patient?.phone || "" },
      chiefComplaint: call.aiSummary?.slice(0, 80) || "Routine checkup",
      symptomsCaptured: call.emergencyDetected ? [{ symptom: "Chest pain", severity: "severe" }, { symptom: "Shortness of breath", severity: "moderate" }] : [{ symptom: "Mild discomfort", severity: "mild" }],
      redFlags: call.emergencyDetected ? ["Emergency keyword detected"] : [],
      triageLevel: call.triageTier ?? 3,
      triageLabel: call.emergencyDetected ? "Emergency" : "Routine",
      aiAssessment: call.aiSummary || "Routine checkup completed.",
      adviceGiven: call.emergencyDetected ? "Advised immediate ER evaluation" : "Continue current plan and monitor.",
      medicationsReviewed: "Lisinopril 10mg daily, Atorvastatin 20mg",
      allergiesFlagged: "None reported",
      chronicConditions: "Hypertension",
      vitalsMentioned: "BP 130/85, HR 72, Temp 36.8C",
      vitals: { bpSystolic: rn(115, 140), bpDiastolic: rn(75, 90), heartRate: rn(65, 95), temperature: Number(rand(36.4, 37.2).toFixed(1)), weight: rn(60, 95), spo2: rn(95, 99), respiratoryRate: rn(14, 20) },
      keyExchanges: (call.transcript || []).slice(0, 4).map((t) => ({ speaker: "Patient", text: t.answer })).concat((call.transcript || []).slice(0, 4).map((t) => ({ speaker: "AI", text: t.question }))),
      nextSteps: call.emergencyDetected ? ["Immediate ER evaluation", "Cardiology follow-up"] : ["Continue monitoring", "Follow-up in 2 weeks"],
      aiQaScores: { accuracy: rn(80, 98), empathy: rn(75, 95), professionalism: rn(85, 99), adherence: rn(80, 95), resolution: rn(70, 90), overall: rn(78, 95) },
      callSummary: call.aiSummary,
      callDuration: call.duration || 300,
      callDate: call.startedAt || call.createdAt || daysAgo(7),
      doctorSigned: Math.random() > 0.4,
      signedBy: Math.random() > 0.4 ? pick(admins) : null,
      signedAt: Math.random() > 0.4 ? daysAgo(rn(1, 7)) : null,
      doctorNotes: "Reviewed AI assessment and findings.",
      createdAt: call.startedAt || call.createdAt || daysAgo(7),
    });
  }
  if (reportBatch.length) {
    await Report.insertMany(reportBatch);
    console.log(`✓ Created ${reportBatch.length} reports`);
  }

  // ── 8. Appointments ──────────────────────────────────────
  const appointments = await Appointment.find({ organization: admin.organization });
  const apptStatuses = ["confirmed", "scheduled", "scheduled", "completed", "completed", "cancelled", "no-show"];
  let apptUpdated = 0;
  for (let i = 0; i < appointments.length; i++) {
    const a = appointments[i];
    const status = apptStatuses[i % apptStatuses.length];
    const dayOffset = status === "completed" ? -rn(1, 14) : status === "cancelled" || status === "no-show" ? -rn(1, 7) : i % 3 === 0 ? 0 : rn(1, 7);
    const date = new Date(daysFromNow(dayOffset));
    date.setHours(9 + (i % 8), (i * 13) % 60, 0, 0);
    await Appointment.updateOne({ _id: a._id }, {
      $set: {
        status,
        date,
        provider: pick(admins),
        type: pick(["in-person", "phone", "video"]),
        title: pick(["Follow-up visit", "Initial consultation", "Annual physical", "Medication review", "Wound care check"]),
        duration: pick([15, 30, 30, 45, 60]),
        location: pick(["Clinic - Room 1", "Clinic - Room 2", "Phone consult", "Video consult"]),
        reason: "Routine follow-up",
        reminderSent: status === "confirmed" || status === "completed",
      },
    });
    apptUpdated++;
  }
  console.log(`✓ Enriched ${apptUpdated} appointments`);

  // ── 9. Audit logs ────────────────────────────────────────
  const auditBatch = [];
  for (let i = 0; i < 60; i++) {
    const user = pick(staff);
    const action = pick(AUDIT_ACTIONS);
    const patient = pick(patients);
    auditBatch.push({
      action,
      userId: user,
      userEmail: "",
      userRole: "staff",
      resourceType: pick(["Patient", "Call", "Appointment", "Config", "User", "Group"]),
      resourceId: patient ? patient._id.toString() : new mongoose.Types.ObjectId().toString(),
      description: AUDIT_DESC[action] || `Performed ${action}`,
      ipAddress: `${rn(10, 223)}.${rn(0, 255)}.${rn(0, 255)}.${rn(1, 254)}`,
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      metadata: { ip_location: pick(["Casablanca, MA", "Rabat, MA", "Marrakech, MA", "Tanger, MA"]), user_agent: "web" },
      timestamp: rdate(daysAgo(30), daysFromNow(0)),
    });
  }
  await AuditLog.insertMany(auditBatch);
  console.log(`✓ Created ${auditBatch.length} audit logs`);

  // ── 10. Consents ─────────────────────────────────────────
  await Consent.deleteMany({ organization: admin.organization });
  const consentBatch = [];
  const consentTypes = ["phone", "email", "sms", "data_processing", "telehealth", "recording"];
  for (let i = 0; i < 8; i++) {
    const patient = pick(patients);
    consentBatch.push({
      patient: patient._id,
      organization: admin.organization,
      type: consentTypes[i % consentTypes.length],
      granted: true,
      grantedBy: admin._id,
      grantedAt: daysAgo(rn(1, 60)),
      source: "staff",
    });
  }
  await Consent.insertMany(consentBatch);
  console.log(`✓ Created ${consentBatch.length} consents`);

  // ── 11. Questionnaires ───────────────────────────────────
  await Questionnaire.deleteMany({ createdBy: { $in: staff } });
  const questionnaireBatch = [
    { title: "Post-Surgery Recovery", description: "Follow-up after surgical procedure", category: "post-surgery", questions: [
      { text: "How would you rate your current pain level?", order: 1, type: "scale" },
      { text: "Is the surgical site red, swollen, or oozing?", order: 2, type: "yesno", followUp: "If yes, describe." },
      { text: "Have you been able to move around comfortably?", order: 3, type: "yesno" },
      { text: "Are you taking your medications as prescribed?", order: 4, type: "yesno" },
      { text: "Any fever or chills since surgery?", order: 5, type: "yesno" },
    ]},
    { title: "Wound Check", description: "Routine wound care follow-up", category: "wound-check", questions: [
      { text: "Describe the wound appearance", order: 1, type: "open" },
      { text: "Is there any drainage or odor?", order: 2, type: "yesno" },
      { text: "Rate the pain at the wound site (0-10)", order: 3, type: "scale" },
      { text: "When was the dressing last changed?", order: 4, type: "open" },
    ]},
    { title: "General Wellness", description: "Standard general check-up", category: "general", questions: [
      { text: "How are you feeling overall today?", order: 1, type: "open" },
      { text: "Any new symptoms in the last week?", order: 2, type: "yesno" },
      { text: "Are you taking your medications regularly?", order: 3, type: "yesno" },
      { text: "Sleep quality on a scale of 1-10?", order: 4, type: "scale" },
    ]},
  ];
  for (const q of questionnaireBatch) {
    await Questionnaire.create({ ...q, createdBy: admin._id, isActive: true });
  }
  console.log(`✓ Created ${questionnaireBatch.length} questionnaires`);

  // ── 12. Provider schedules ───────────────────────────────
  await ProviderSchedule.deleteMany({ organization: admin.organization });
  const scheduleBatch = [];
  for (const doc of [sarah, karim]) {
    for (let d = 1; d <= 5; d++) {
      scheduleBatch.push({ provider: doc._id, organization: admin.organization, dayOfWeek: d, startTime: "09:00", endTime: "17:00", slotDuration: 30, bufferBetween: 10, isActive: true });
    }
  }
  await ProviderSchedule.insertMany(scheduleBatch);
  console.log(`✓ Created ${scheduleBatch.length} provider schedules`);

  // ── 13. Booking tokens ───────────────────────────────────
  await BookingToken.deleteMany({ organization: admin.organization, used: false });
  const bookingBatch = [];
  for (let i = 0; i < 3; i++) {
    const patient = pick(patients);
    bookingBatch.push({ patient: patient._id, organization: admin.organization, provider: pick(admins), token: crypto.randomBytes(16).toString("hex"), expiresAt: daysFromNow(30), used: false });
  }
  const bookingDocs = await BookingToken.insertMany(bookingBatch);
  console.log(`✓ Created ${bookingDocs.length} booking tokens`);
  console.log(`   Booking link: /book/${bookingDocs[0].token}`);

  // ── 14. Notifications ────────────────────────────────────
  const orgUser = await User.find({ organization: admin.organization });
  const notifBatch = [];
  const emergencyCall = allCalls.find((c) => c.emergencyDetected) || allCalls[0];
  for (const u of orgUser) {
    notifBatch.push({
      user: u._id, type: "emergency", title: "Emergency detected", message: `Emergency detected on a recent call. Review immediately.`, link: `/call-review`, call: emergencyCall?._id, patient: emergencyCall?.patient, read: false,
    });
    notifBatch.push({
      user: u._id, type: "high_severity", title: "High-severity call", message: "A high-severity call needs review.", link: `/call-review`, call: allCalls.find((c) => c.aiSeverityScore >= 7)?._id, read: false,
    });
    notifBatch.push({
      user: u._id, type: "inbound_completed", title: "Inbound call completed", message: "An inbound patient call completed and is ready for review.", link: `/inbound-calls`, read: false,
    });
    notifBatch.push({
      user: u._id, type: "appointment_confirmed", title: "Appointment confirmed", message: "A new appointment was confirmed.", link: `/appointments`, read: Math.random() > 0.5,
    });
  }
  await Notification.insertMany(notifBatch);
  console.log(`✓ Created ${notifBatch.length} notifications`);

  console.log("\n========================================");
  console.log("✅ SEED COMPLETE");
  console.log(`   Caregiver login: caregiver@demo-clinic.com / test1234`);
  console.log(`   Patient portal (2): jwilson@email.com / mgarcia@email.com / rocky.owner@email.com → password test1234`);
  console.log(`   Family link: /family/${familyToken}`);
  console.log(`   Booking link: /book/${bookingDocs[0].token}`);
  console.log("========================================");

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
