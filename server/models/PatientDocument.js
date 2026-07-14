import mongoose from "mongoose";

const patientDocumentSchema = new mongoose.Schema({
  patient:     { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
  organization:{ type: mongoose.Schema.Types.ObjectId, ref: "Organization", default: null },
  fileName:    { type: String, required: true },
  originalName:{ type: String, required: true },
  mimeType:    { type: String, required: true },
  size:        { type: Number, required: true },
  docType:     { type: String, default: "other" },
  tags:        [{ type: String }],
  ocrText:     { type: String, default: "" },
  ocrProcessed:{ type: Boolean, default: false },
  uploadedBy:  { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });

patientDocumentSchema.index({ patient: 1, createdAt: -1 });
patientDocumentSchema.index({ organization: 1, docType: 1 });
patientDocumentSchema.textIndex = patientDocumentSchema.index({ ocrText: "text", tags: "text" });

export default mongoose.model("PatientDocument", patientDocumentSchema);
