import mongoose from "mongoose";

const serverConfigSchema = new mongoose.Schema({
  key:   { type: String, required: true, unique: true },
  value: { type: String, default: "" },
  label: { type: String, default: "" },
  masked:{ type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model("ServerConfig", serverConfigSchema);
