import mongoose from "mongoose";

const bookingTokenSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true },
  provider: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  token: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } },
  usedAt: { type: Date, default: null },
  used: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model("BookingToken", bookingTokenSchema);
