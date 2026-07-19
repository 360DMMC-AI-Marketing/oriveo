import mongoose from "mongoose";

const providerScheduleSchema = new mongoose.Schema({
  provider: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true },
  dayOfWeek: { type: Number, required: true, min: 0, max: 6 },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  slotDuration: { type: Number, default: null },
  bufferBetween: { type: Number, default: null },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

providerScheduleSchema.index({ provider: 1, dayOfWeek: 1 });
providerScheduleSchema.index({ organization: 1, provider: 1 });

export default mongoose.model("ProviderSchedule", providerScheduleSchema);
