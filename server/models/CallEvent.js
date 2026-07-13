import mongoose from "mongoose";

const callEventSchema = new mongoose.Schema({
  organization: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", default: null },
  callId: { type: mongoose.Schema.Types.ObjectId, ref: "Call", required: true, index: true },
  type: {
    type: String,
    enum: ["transcript", "triage", "emotion", "error", "transfer", "language_detected", "state_change"],
    required: true,
  },
  data: { type: Object, default: {} },
  timestamp: { type: Date, default: Date.now },
});

callEventSchema.index({ callId: 1, timestamp: 1 });

export default mongoose.model("CallEvent", callEventSchema);
