import mongoose from "mongoose";

const questionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  order: { type: Number, required: true },
  type: { type: String, enum: ["open", "scale", "yesno"], default: "open" },
  followUp: { type: String, default: "" },
});

const questionnaireSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    language: { type: String, default: "en" },
    category: {
      type: String,
      enum: ["post-surgery", "wound-check", "general", "chronic", "custom"],
      default: "general",
    },
    questions: [questionSchema],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    isTemplate: { type: Boolean, default: false },
    isDefault: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

questionnaireSchema.index({ createdBy: 1 });
questionnaireSchema.index({ createdBy: 1, createdAt: -1 });
questionnaireSchema.index({ category: 1 });
questionnaireSchema.index({ language: 1 });
questionnaireSchema.index({ isTemplate: 1 });
questionnaireSchema.index({ title: "text", description: "text" });

export default mongoose.model("Questionnaire", questionnaireSchema);
