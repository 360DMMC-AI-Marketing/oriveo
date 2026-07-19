import mongoose from "mongoose";

const diagnosisSchema = new mongoose.Schema({
  code: { type: String, required: true },
  name: { type: String, required: true },
  laterality: { type: String, enum: ["unspecified", "left", "right", "bilateral"], default: "unspecified" },
}, { _id: false });

const medicationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  dose: { type: String, default: "" },
  route: { type: String, enum: ["oral", "topical", "iv", "im", "sublingual", "inhaled", "other"], default: "oral" },
  frequency: { type: String, default: "" },
}, { _id: false });

const assessmentScaleSchema = new mongoose.Schema({
  scaleId: { type: String },
  label: { type: String },
  score: { type: String },
  interpretation: { type: String },
}, { _id: false });

const clinicalNoteSchema = new mongoose.Schema({
  patient:     { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
  organization:{ type: mongoose.Schema.Types.ObjectId, ref: "Organization", default: null },
  specialty:   { type: String, default: "general-practice" },
  clinicType:  { type: String, enum: ["human", "dental", "veterinary"], default: "human" },

  encounterDate: { type: Date, default: Date.now },
  encounterType: { type: String, enum: ["office", "telehealth", "phone", "home", "emergency"], default: "office" },

  subjective:   { type: String, default: "" },
  objective:    { type: String, default: "" },
  assessment:   { type: String, default: "" },
  plan:         { type: String, default: "" },

  hpi:         { type: String, default: "" },
  ros:         { type: String, default: "" },
  physicalExam: { type: String, default: "" },

  diagnoses:    [diagnosisSchema],
  medications:  [medicationSchema],
  orders:       [{ type: String }],

  vitals: {
    bpSystolic:  { type: Number, default: null },
    bpDiastolic: { type: Number, default: null },
    heartRate:   { type: Number, default: null },
    temperature: { type: Number, default: null },
    weight:      { type: Number, default: null },
    spo2:        { type: Number, default: null },
    respiratoryRate: { type: Number, default: null },
    painScore:   { type: Number, default: null },
  },

  assessmentScales: [assessmentScaleSchema],

  imagingFindings:  { type: String, default: "" },
  labResults:       { type: String, default: "" },
  treatmentSummary: { type: String, default: "" },
  medicalHistory:   { type: String, default: "" },

  followUp: {
    recommended: { type: Boolean, default: false },
    timeframe:   { type: String, default: "" },
    notes:       { type: String, default: "" },
  },

  isSigned:    { type: Boolean, default: false },
  signedBy:    { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  signedAt:    { type: Date, default: null },
  signatureName:  { type: String, default: "" },
  signatureTitle: { type: String, default: "" },

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  isActive:  { type: Boolean, default: true },
  specialtySections: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

clinicalNoteSchema.index({ patient: 1, encounterDate: -1 });
clinicalNoteSchema.index({ organization: 1, specialty: 1 });
clinicalNoteSchema.index({ isSigned: 1 });

export default mongoose.model("ClinicalNote", clinicalNoteSchema);
