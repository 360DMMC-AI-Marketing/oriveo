import mongoose from "mongoose";

const icd10CodeSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  name: { type: String, required: true },
  category: { type: String, default: "" },
  specialty: { type: [String], default: [] },
}, { timestamps: true });

icd10CodeSchema.index({ name: "text", code: "text" });

export default mongoose.model("Icd10Code", icd10CodeSchema);
