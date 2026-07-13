import mongoose from "mongoose";

const transcriptEntrySchema = new mongoose.Schema({
  question: { type: String, required: true },
  answer: { type: String, default: "" },
  timestamp: { type: Number, default: 0 },
});

const qaScoreSchema = new mongoose.Schema({
  scores: {
    accuracy: { type: Number, default: 0 },
    empathy: { type: Number, default: 0 },
    professionalism: { type: Number, default: 0 },
    adherence: { type: Number, default: 0 },
    resolution: { type: Number, default: 0 },
  },
  overall: { type: Number, default: 0 },
  strengths: [String],
  weaknesses: [String],
  summary: { type: String, default: "" },
  scoredAt: { type: Date, default: null },
}, { _id: false });

const callSchema = new mongoose.Schema(
  {
    direction: { type: String, enum: ["outbound", "inbound"], default: "outbound" },
    organization: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", default: null },
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", default: null },
    questionnaire: { type: mongoose.Schema.Types.ObjectId, ref: "Questionnaire", default: null },
    startedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    status: {
      type: String,
      enum: ["scheduled", "in-progress", "completed", "failed", "cancelled", "transferred"],
      default: "scheduled",
    },
    scheduledAt: { type: Date, default: null },
    startedAt: { type: Date, default: null },
    endedAt: { type: Date, default: null },
    duration: { type: Number, default: 0 },
    audioUrl: { type: String, default: "" },
    transcript: [transcriptEntrySchema],
    aiSummary: { type: String, default: "" },
    aiSeverityScore: { type: Number, default: null },
    language: { type: String, default: "en" },
    twilioCallSid: { type: String, default: "" },
    patientResponded: { type: Boolean, default: null },
    recallCount: { type: Number, default: 0 },
    aiRecommendations: { type: String, default: "" },
    nextAppointmentDate: { type: Date, default: null },
    nextAppointmentPlace: { type: String, default: "" },
    triageTier: { type: Number, default: 3 },
    highestTier: { type: Number, default: 3 },
    redFlags: [{
      tier: { type: Number },
      keyword: { type: String },
      text: { type: String },
      crisis: { type: Boolean, default: false },
    }],
    concerningStatements: [{
      text: { type: String },
      timestamp: { type: Number },
      flags: [String],
    }],
    escalationAction: { type: Object, default: null },
    crisisPathwayUsed: { type: Boolean, default: false },
    identityVerified: { type: Boolean, default: false },
    consentRecorded: { type: Boolean, default: false },
    identityMethod: { type: String, default: "" },
    doNotCall: { type: Boolean, default: false },
    optOutReason: { type: String, default: "" },
    verificationAttempts: { type: Number, default: 0 },
    transferReason: { type: String, default: "" },
    customQuestions: [{ type: String }],
    qaScore: { type: qaScoreSchema, default: null },
    emotionalState: {
      primary: { type: String, default: "neutral" },
      intensity: { type: Number, default: 0 },
      painLevel: { type: String, default: null },
    },
    emergencyDetected: { type: Boolean, default: false },
    emergencyConfirmedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    emergencyActionTaken: { type: String, enum: ["none", "called_911", "called_clinic", "both"], default: "none" },
    emergencyCalledAt: { type: Date, default: null },
    emergencyType: { type: String, enum: ["medical", "crisis", "fire", "other", null], default: null },
  },
  { timestamps: true }
);

callSchema.index({ organization: 1, createdAt: -1 });
callSchema.index({ patient: 1, createdAt: -1 });
callSchema.index({ status: 1 });
callSchema.index({ startedBy: 1 });
callSchema.index({ startedBy: 1, createdAt: -1 });
callSchema.index({ patient: 1, status: 1 });
callSchema.index({ status: 1, createdAt: -1 });
callSchema.index({ scheduledAt: 1 });
callSchema.index({ questionnaire: 1 });

export default mongoose.model("Call", callSchema);
