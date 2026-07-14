import mongoose from "mongoose";

const clinicalTemplateSchema = new mongoose.Schema({
  organization:    { type: mongoose.Schema.Types.ObjectId, ref: "Organization", default: null },
  specialty:       { type: String, default: "general" },
  name:            { type: String, required: true },
  description:     { type: String, default: "" },

  subjectivePrompt:  { type: String, default: "" },
  objectivePrompt:   { type: String, default: "" },
  assessmentPrompt:  { type: String, default: "" },
  planPrompt:        { type: String, default: "" },

  commonDiagnoses: [{ code: String, name: String }],
  commonMedications: [{ name: String, dose: String, route: { type: String, default: "oral" }, frequency: String }],
  commonOrders:    [{ type: String }],

  isBuiltIn:   { type: Boolean, default: false },
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  isActive:    { type: Boolean, default: true },
}, { timestamps: true });

clinicalTemplateSchema.index({ organization: 1, specialty: 1 });

export default mongoose.model("ClinicalTemplate", clinicalTemplateSchema);
