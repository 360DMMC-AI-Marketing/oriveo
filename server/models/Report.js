import mongoose from "mongoose";

const specialtyExamFindingsSchema = new mongoose.Schema({
  testName: { type: String },
  result: { type: String },
  interpretation: { type: String },
  referenceRange: { type: String },
}, { _id: false });

const assessmentScalesSchema = new mongoose.Schema({
  scaleId: { type: String },
  label: { type: String },
  score: { type: String },
  interpretation: { type: String },
}, { _id: false });

const reportSchema = new mongoose.Schema({
  call: { type: mongoose.Schema.Types.ObjectId, ref: "Call", required: true, unique: true },
  patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
  generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", default: null },
  specialty: { type: String, default: "general-practice" },
  clinicType: { type: String, enum: ["human", "dental", "veterinary"], default: "human" },

  patientInfo: {
    name: String,
    age: Number,
    gender: String,
    phone: String,
  },
  chiefComplaint: { type: String },
  symptomsCaptured: [{ symptom: String, severity: String }],
  redFlags: [String],
  triageLevel: { type: Number },
  triageLabel: { type: String },
  aiAssessment: { type: String },
  adviceGiven: { type: String },
  medicationsReviewed: { type: String },
  allergiesFlagged: { type: String },
  chronicConditions: { type: String },
  vitalsMentioned: { type: String },
  vitals: {
    bpSystolic: Number,
    bpDiastolic: Number,
    heartRate: Number,
    temperature: Number,
    weight: Number,
    spo2: Number,
    respiratoryRate: Number,
  },
  physicalExamFindings: { type: String },
  keyExchanges: [{ speaker: String, text: String }],
  nextSteps: [String],
  aiQaScores: {
    accuracy: Number,
    empathy: Number,
    professionalism: Number,
    adherence: Number,
    resolution: Number,
    overall: Number,
  },
  callSummary: { type: String },
  callDuration: Number,
  callDate: Date,
  doctorSigned: { type: Boolean, default: false },
  signedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  signedAt: Date,
  digitalSignature: { type: String, default: "" },
  signatureTitle: { type: String, default: "" },
  doctorNotes: { type: String },

  specialtyData: {
    diagnosisCodes: [{ code: String, name: String, laterality: { type: String, default: "unspecified" } }],
    assessmentScales: [assessmentScalesSchema],
    examFindings: [specialtyExamFindingsSchema],
    imagingFindings: { type: String },
    labResults: { type: String },
    proceduresPerformed: [{ type: String }],
    treatmentSummary: { type: String },
    followUpRecommendation: { type: String },
    structuredFields: { type: mongoose.Schema.Types.Mixed },
  },

  createdAt: { type: Date, default: Date.now },
});

reportSchema.index({ patient: 1, createdAt: -1 });
reportSchema.index({ "patientInfo.name": "text", chiefComplaint: "text", aiAssessment: "text" });

export default mongoose.model("Report", reportSchema);
