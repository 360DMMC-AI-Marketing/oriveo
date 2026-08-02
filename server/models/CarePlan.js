import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    frequency: { type: String, enum: ["daily", "weekly", "monthly", "once"], default: "daily" },
    dueDate: { type: Date, default: null },
    completed: { type: Boolean, default: false },
    completedAt: { type: Date, default: null },
    completedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { _id: true }
);

const medicationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    dose: { type: String, default: "" },
    frequency: { type: String, default: "" },
    instructions: { type: String, default: "" },
  },
  { _id: true }
);

const carePlanSchema = new mongoose.Schema(
  {
    organization: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", default: null },
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
    caregiver: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    status: { type: String, enum: ["active", "paused", "completed", "cancelled"], default: "active" },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date, default: null },
    tasks: { type: [taskSchema], default: [] },
    medications: { type: [medicationSchema], default: [] },
    emergencyContacts: { type: [String], default: [] },
    notes: { type: String, default: "" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

carePlanSchema.index({ organization: 1 });
carePlanSchema.index({ patient: 1 });
carePlanSchema.index({ caregiver: 1 });
carePlanSchema.index({ status: 1 });
carePlanSchema.index({ organization: 1, status: 1 });

export default mongoose.model("CarePlan", carePlanSchema);
