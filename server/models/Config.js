import mongoose from "mongoose";

const configSchema = new mongoose.Schema({
  provider: { type: String, required: true, unique: true, trim: true },
  keys: { type: Map, of: String, default: {} },
}, { timestamps: true });

export default mongoose.model("Config", configSchema);
