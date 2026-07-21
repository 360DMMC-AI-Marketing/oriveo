import mongoose from "mongoose";

const consentSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", default: null },
  type: {
    type: String,
    enum: ["phone", "email", "sms", "data_processing", "telehealth", "recording"],
    required: true,
  },
  granted: { type: Boolean, required: true },
  ipAddress: { type: String, default: "" },
  userAgent: { type: String, default: "" },
  grantedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  grantedAt: { type: Date, default: Date.now },
  revokedAt: { type: Date, default: null },
  source: { type: String, enum: ["portal", "staff", "api", "call"], default: "staff" },
}, { timestamps: true });

consentSchema.index({ patient: 1, type: 1 });
consentSchema.index({ patient: 1, granted: 1 });
consentSchema.index({ organization: 1 });

export default mongoose.model("Consent", consentSchema);
