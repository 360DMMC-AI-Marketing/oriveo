import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: {
      type: String,
      enum: [
        "emergency", "high_severity", "inbound_received", "inbound_completed",
        "report_ready", "call_failed", "follow_up_needed", "appointment_reminder",
        "system_alert", "call_transferred", "appointment_pending", "appointment_confirmed",
      ],
      required: true,
      index: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    link: { type: String, default: "" },
    call: { type: mongoose.Schema.Types.ObjectId, ref: "Call", default: null },
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", default: null },
    read: { type: Boolean, default: false, index: true },
    readAt: { type: Date, default: null },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, read: 1 });
notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 3600 });

export default mongoose.model("Notification", notificationSchema);
