import mongoose from "mongoose";

const bookingTokenSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true },
  token: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true },
  usedAt: { type: Date, default: null },
}, { timestamps: true });

bookingTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("BookingToken", bookingTokenSchema);
