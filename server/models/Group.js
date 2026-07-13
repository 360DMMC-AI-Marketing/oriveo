import mongoose from "mongoose";

const groupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    diagnosisFilter: { type: String, default: "" },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "Patient" }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    callCount: { type: Number, default: 0 },
    lastCalledAt: { type: Date, default: null },
  },
  { timestamps: true }
);

groupSchema.index({ createdBy: 1 });
groupSchema.index({ createdBy: 1, createdAt: -1 });
groupSchema.index({ name: "text", description: "text" });
groupSchema.index({ diagnosisFilter: 1 });

export default mongoose.model("Group", groupSchema);
