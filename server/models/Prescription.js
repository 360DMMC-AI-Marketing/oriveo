import mongoose from "mongoose";

const prescriptionSchema = new mongoose.Schema(
  {
    organization: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", default: null },
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
    prescribedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    medication: { type: String, required: true, trim: true },
    dosage: { type: String, default: "" },
    route: { type: String, enum: ["oral", "topical", "IV", "IM", "subcutaneous", "inhalation", "ophthalmic", "otic", "rectal", "sublingual", ""], default: "" },
    frequency: { type: String, default: "" },
    instructions: { type: String, default: "" },
    quantity: { type: Number, default: null },
    refills: { type: Number, default: 0 },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date, default: null },
    status: { type: String, enum: ["active", "filled", "expired", "cancelled", "completed"], default: "active" },
    isSigned: { type: Boolean, default: false },
    signedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    signedAt: { type: Date, default: null },
    signatureName: { type: String, default: "" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

prescriptionSchema.index({ organization: 1 });
prescriptionSchema.index({ patient: 1 });
prescriptionSchema.index({ status: 1 });
prescriptionSchema.index({ patient: 1, createdAt: -1 });
prescriptionSchema.index({ organization: 1, status: 1 });

export default mongoose.model("Prescription", prescriptionSchema);
