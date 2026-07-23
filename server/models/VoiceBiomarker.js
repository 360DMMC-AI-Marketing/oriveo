import mongoose from "mongoose";

const voiceBiomarkerSchema = new mongoose.Schema(
  {
    organization: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true },
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
    call: { type: mongoose.Schema.Types.ObjectId, ref: "Call", required: true },

    // Raw audio features extracted from call
    audioFeatures: {
      speechRate: { type: Number, default: null },        // words per minute
      pauseRatio: { type: Number, default: null },         // % of call spent in silence
      avgPauseDuration: { type: Number, default: null },   // avg pause length in seconds
      pitchMean: { type: Number, default: null },          // fundamental frequency Hz
      pitchVariability: { type: Number, default: null },   // std dev of pitch
      jitter: { type: Number, default: null },             // pitch perturbation (%)
      shimmer: { type: Number, default: null },            // amplitude perturbation (%)
      breathRate: { type: Number, default: null },         // breaths per minute estimate
      voiceEnergy: { type: Number, default: null },        // RMS energy of speech segments
      articulationRate: { type: Number, default: null },   // speech rate excluding pauses
    },

    // Derived clinical biomarker scores (0-100)
    biomarkers: {
      respiratory: { type: Number, default: null },   // respiratory effort/distress
      cognitive: { type: Number, default: null },     // cognitive load / decline signal
      fatigue: { type: Number, default: null },       // fatigue / exhaustion
      mood: { type: Number, default: null },          // mood / depression signal
      pain: { type: Number, default: null },          // pain / discomfort signal
      anxiety: { type: Number, default: null },       // anxiety / stress signal
    },

    // Composite health index (0-100, higher = healthier)
    healthIndex: { type: Number, default: null },

    // Flags
    flags: [{
      type: { type: String, enum: ["respiratory_decline", "cognitive_decline", "fatigue_spike", "mood_decline", "pain_increase", "anxiety_spike"] },
      severity: { type: String, enum: ["low", "medium", "high"] },
      message: { type: String },
    }],

    // Rolling trend (updated after each call)
    trend: {
      healthIndexDelta: { type: Number, default: 0 },     // change from previous call
      healthIndexTrend: { type: String, enum: ["improving", "stable", "declining", null], default: null },
      decliningStreak: { type: Number, default: 0 },       // consecutive declining calls
    },

    // Proactive care
    proactiveCare: {
      triggered: { type: Boolean, default: false },
      triggerReason: { type: String, default: "" },
      callScheduled: { type: Boolean, default: false },
      callCompleted: { type: Boolean, default: false },
      billableCode: { type: String, default: "" },          // CCM/RPM/BHI code
      billableAmount: { type: Number, default: 0 },         // estimated reimbursement $
    },
  },
  { timestamps: true }
);

voiceBiomarkerSchema.index({ organization: 1, createdAt: -1 });
voiceBiomarkerSchema.index({ patient: 1, createdAt: -1 });
voiceBiomarkerSchema.index({ patient: 1, call: 1 }, { unique: true });
voiceBiomarkerSchema.index({ "trend.decliningStreak": -1 });
voiceBiomarkerSchema.index({ "proactiveCare.triggered": 1 });
voiceBiomarkerSchema.index({ healthIndex: 1 });

export default mongoose.model("VoiceBiomarker", voiceBiomarkerSchema);
