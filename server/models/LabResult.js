import mongoose from "mongoose";

const labTestSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    loinc: { type: String, default: "" },
    value: { type: String, default: "" },
    unit: { type: String, default: "" },
    referenceLow: { type: String, default: "" },
    referenceHigh: { type: String, default: "" },
    status: { type: String, enum: ["normal", "high", "low", "critical", "pending"], default: "pending" },
    note: { type: String, default: "" },
  },
  { _id: true }
);

const labResultSchema = new mongoose.Schema(
  {
    organization: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", default: null },
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
    orderedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    panel: { type: String, default: "General" },
    status: { type: String, enum: ["ordered", "collected", "in-progress", "completed", "cancelled"], default: "ordered" },
    orderedAt: { type: Date, default: Date.now },
    collectedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    tests: { type: [labTestSchema], default: [] },
    notes: { type: String, default: "" },
    attachments: [{ type: mongoose.Schema.Types.ObjectId, ref: "PatientDocument", default: [] }],
  },
  { timestamps: true }
);

labResultSchema.index({ organization: 1 });
labResultSchema.index({ patient: 1 });
labResultSchema.index({ status: 1 });
labResultSchema.index({ patient: 1, orderedAt: -1 });
labResultSchema.index({ organization: 1, status: 1 });

export default mongoose.model("LabResult", labResultSchema);
