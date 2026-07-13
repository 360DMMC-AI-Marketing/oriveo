import mongoose from "mongoose";

const availabilitySchema = new mongoose.Schema({
  organization: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true },
  dayOfWeek: { type: Number, required: true, min: 0, max: 6 },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  slotDuration: { type: Number, default: 30 },
  bufferBetween: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

availabilitySchema.index({ organization: 1, dayOfWeek: 1 });

export default mongoose.model("Availability", availabilitySchema);
