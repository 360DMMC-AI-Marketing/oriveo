import mongoose from "mongoose";

const reportSchema = new mongoose.Schema({
  call: { type: mongoose.Schema.Types.ObjectId, ref: "Call", required: true, unique: true },
  patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
  generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
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
  createdAt: { type: Date, default: Date.now },
});

reportSchema.index({ patient: 1, createdAt: -1 });
reportSchema.index({ "patientInfo.name": "text", chiefComplaint: "text", aiAssessment: "text" });

export default mongoose.model("Report", reportSchema);
