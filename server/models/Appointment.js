import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
  {
    organization: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", default: null },
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
    call: { type: mongoose.Schema.Types.ObjectId, ref: "Call", default: null },
    bookedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    date: { type: Date, required: true },
    duration: { type: Number, default: 30 },
    location: { type: String, default: "" },
    type: {
      type: String,
      enum: ["in-person", "phone", "video"],
      default: "in-person",
    },
    status: {
      type: String,
      enum: ["scheduled", "confirmed", "in-progress", "completed", "cancelled", "no-show"],
      default: "scheduled",
    },
    notes: { type: String, default: "" },
    reminderSent: { type: Boolean, default: false },
    reminderScheduledAt: { type: Date, default: null },
    googleCalendarEventId: { type: String, default: "" },
    reason: { type: String, default: "" },
  },
  { timestamps: true }
);

appointmentSchema.index({ organization: 1, date: -1 });
appointmentSchema.index({ patient: 1, date: -1 });
appointmentSchema.index({ date: 1, status: 1 });
appointmentSchema.index({ call: 1 });
appointmentSchema.index({ bookedBy: 1, createdAt: -1 });
appointmentSchema.index({ title: "text", description: "text" });

export default mongoose.model("Appointment", appointmentSchema);
