import mongoose from "mongoose";

const knowledgeDocSchema = new mongoose.Schema({
  docId: { type: String, required: true, index: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  chunkIndex: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

knowledgeDocSchema.index({ docId: 1, chunkIndex: 1 });
knowledgeDocSchema.index({ content: "text", title: "text" });
knowledgeDocSchema.index({ createdAt: -1 });

export default mongoose.model("KnowledgeDoc", knowledgeDocSchema);
