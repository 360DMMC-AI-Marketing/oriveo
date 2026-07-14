import mongoose from "mongoose";

const medicalRecordSchema = new mongoose.Schema({
  patient:     { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
  organization:{ type: mongoose.Schema.Types.ObjectId, ref: "Organization", default: null },
  type:        { type: String, enum: ["diagnosis", "surgery", "medication", "allergy", "lab", "vaccine", "imaging", "note", "other"], required: true },
  title:       { type: String, required: true },
  description: { type: String, default: "" },
  date:        { type: Date, default: Date.now },
  doctor:      { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  attachments: [{ type: mongoose.Schema.Types.ObjectId, ref: "PatientDocument" }],
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  isActive:    { type: Boolean, default: true },
}, { timestamps: true });

medicalRecordSchema.index({ patient: 1, date: -1 });
medicalRecordSchema.index({ organization: 1, type: 1 });
medicalRecordSchema.index({ patient: 1, type: 1 });

export default mongoose.model("MedicalRecord", medicalRecordSchema);
