import mongoose from "mongoose";

const vitalSignSchema = new mongoose.Schema({
  patient:     { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
  organization:{ type: mongoose.Schema.Types.ObjectId, ref: "Organization", default: null },
  bpSystolic:  { type: Number, default: null },
  bpDiastolic: { type: Number, default: null },
  heartRate:   { type: Number, default: null },
  temperature: { type: Number, default: null },
  weight:      { type: Number, default: null },
  spo2:        { type: Number, default: null },
  notes:       { type: String, default: "" },
  recordedBy:  { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  recordedAt:  { type: Date, default: Date.now },
}, { timestamps: true });

vitalSignSchema.index({ patient: 1, recordedAt: -1 });
vitalSignSchema.index({ organization: 1 });

export default mongoose.model("VitalSign", vitalSignSchema);
