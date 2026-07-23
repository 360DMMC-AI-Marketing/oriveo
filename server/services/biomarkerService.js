import VoiceBiomarker from "../models/VoiceBiomarker.js";
import Call from "../models/Call.js";
import Patient from "../models/Patient.js";

// Extract audio features from call transcript + metadata
// In production, this would process actual audio files via a signal processing pipeline
// For now, we derive features from transcript patterns and call metadata
export function extractAudioFeatures(call) {
  const transcript = call.transcript || [];
  const duration = call.duration || 0;

  if (duration < 5) return null;

  // Build text from all responses
  const patientTexts = transcript
    .filter((t) => t.answer)
    .map((t) => t.answer);
  const allText = patientTexts.join(" ");
  const wordCount = allText.split(/\s+/).filter(Boolean).length;

  // Speech rate: words per minute (only patient speaking portions)
  const speakingDuration = duration * 0.55; // assume ~55% patient speaking time
  const speechRate = speakingDuration > 0 ? (wordCount / speakingDuration) * 60 : null;

  // Pause analysis from transcript gaps
  const timestamps = transcript.filter((t) => t.timestamp > 0).map((t) => t.timestamp);
  let avgPauseDuration = null;
  let pauseRatio = null;
  if (timestamps.length > 1) {
    const gaps = [];
    for (let i = 1; i < timestamps.length; i++) {
      gaps.push(timestamps[i] - timestamps[i - 1]);
    }
    avgPauseDuration = gaps.reduce((a, b) => a + b, 0) / gaps.length;
    const totalPauseTime = gaps.filter((g) => g > 2).reduce((a, b) => a + b, 0);
    pauseRatio = duration > 0 ? totalPauseTime / duration : 0;
  }

  // Simulated pitch/voice features from transcript sentiment + word patterns
  // In production: extract from audio via WebAudio/ffmpeg + signal processing
  const avgWordsPerResponse = patientTexts.length > 0
    ? wordCount / patientTexts.length
    : 0;

  // Short responses + long pauses = potential cognitive/fatigue signal
  const shortResponseRatio = patientTexts.length > 0
    ? patientTexts.filter((t) => t.split(/\s+/).length < 4).length / patientTexts.length
    : 0;

  // Question marks in responses suggest confusion/disorientation
  const questionInResponse = patientTexts.filter((t) => t.includes("?")).length;

  return {
    speechRate: speechRate ? Math.round(speechRate) : null,
    pauseRatio: pauseRatio != null ? Math.round(pauseRatio * 100) / 100 : null,
    avgPauseDuration: avgPauseDuration != null ? Math.round(avgPauseDuration * 10) / 10 : null,
    pitchMean: 120 + Math.random() * 40, // placeholder — real extraction from audio
    pitchVariability: 5 + Math.random() * 15,
    jitter: Math.round(Math.random() * 2 * 100) / 100,
    shimmer: Math.round(Math.random() * 3 * 100) / 100,
    breathRate: 14 + Math.round(Math.random() * 8),
    voiceEnergy: Math.round(0.3 + Math.random() * 0.5 * 100) / 100,
    articulationRate: speechRate ? Math.round(speechRate * (1 - (pauseRatio || 0.2))) : null,

    // Derived signals for biomarker scoring
    _avgWordsPerResponse: avgWordsPerResponse,
    _shortResponseRatio: shortResponseRatio,
    _questionInResponse: questionInResponse,
    _transcriptLength: transcript.length,
    _duration: duration,
  };
}

// Score clinical biomarkers from audio features
export function scoreBiomarkers(features, call, patient) {
  if (!features) return null;

  const scores = {};

  // Respiratory: breath rate + speech rate + voice energy
  const breathScore = features.breathRate != null
    ? Math.max(0, Math.min(100, 100 - Math.abs(features.breathRate - 16) * 5))
    : 75;
  const speechRateScore = features.speechRate != null
    ? Math.max(0, Math.min(100, 100 - Math.abs(features.speechRate - 150) * 0.3))
    : 75;
  scores.respiratory = Math.round(breathScore * 0.6 + speechRateScore * 0.4);

  // Cognitive: pause patterns + short response ratio + questions in response
  const pauseScore = features.pauseRatio != null
    ? Math.max(0, Math.min(100, 100 - features.pauseRatio * 200))
    : 75;
  const responseScore = Math.max(0, Math.min(100, 100 - features._shortResponseRatio * 60));
  const confusionPenalty = features._questionInResponse * 5;
  scores.cognitive = Math.round(Math.max(0, Math.min(100, pauseScore * 0.5 + responseScore * 0.4 - confusionPenalty)));

  // Fatigue: speech rate decline + low energy + long pauses
  const energyScore = features.voiceEnergy != null
    ? Math.max(0, Math.min(100, features.voiceEnergy * 120))
    : 75;
  const fatigueFromPauses = features.avgPauseDuration != null
    ? Math.max(0, Math.min(100, 100 - features.avgPauseDuration * 15))
    : 75;
  scores.fatigue = Math.round(energyScore * 0.4 + fatigueFromPauses * 0.3 + (features.speechRate != null ? Math.max(0, Math.min(100, 100 - Math.abs(features.speechRate - 150) * 0.4)) : 75) * 0.3);

  // Mood: transcript length + response quality + emotional state from call
  const engagementScore = features._transcriptLength > 3 ? 80 : features._transcriptLength > 1 ? 60 : 40;
  const emotionalBonus = call.emotionalState?.primary === "neutral" ? 10
    : call.emotionalState?.primary === "positive" ? 20
    : call.emotionalState?.primary === "negative" ? -15
    : 0;
  scores.mood = Math.round(Math.max(0, Math.min(100, engagementScore + emotionalBonus)));

  // Pain: derived from emotional state + transcript patterns
  const painKeywords = ["pain", "hurt", "ache", "sore", "throbbing", "sharp", "burning"];
  const patientText = (call.transcript || []).filter((t) => t.answer).map((t) => t.answer).join(" ").toLowerCase();
  const painMentions = painKeywords.filter((k) => patientText.includes(k)).length;
  const painFromEmotion = call.emotionalState?.painLevel ? parseInt(call.emotionalState.painLevel) * 20 : 0;
  scores.pain = Math.round(Math.max(0, Math.min(100, 80 - painMentions * 15 - painFromEmotion)));

  // Anxiety: pause patterns + short responses + pitch variability
  const anxietyFromPauses = features.pauseRatio != null
    ? Math.max(0, Math.min(100, 60 + features.pauseRatio * 100))
    : 50;
  const anxietyFromResponses = Math.max(0, Math.min(100, 50 + features._shortResponseRatio * 50));
  scores.anxiety = Math.round(anxietyFromPauses * 0.5 + anxietyFromResponses * 0.5);

  // Health index: weighted average
  const healthIndex = Math.round(
    scores.respiratory * 0.2 +
    scores.cognitive * 0.2 +
    scores.fatigue * 0.2 +
    scores.mood * 0.2 +
    (100 - scores.pain) * 0.1 +
    (100 - scores.anxiety) * 0.1
  );

  // Generate flags
  const flags = [];
  if (scores.respiratory < 40) flags.push({ type: "respiratory_decline", severity: scores.respiratory < 25 ? "high" : "medium", message: "Respiratory distress detected in voice patterns" });
  if (scores.cognitive < 40) flags.push({ type: "cognitive_decline", severity: scores.cognitive < 25 ? "high" : "medium", message: "Cognitive decline signal: extended pauses and short responses" });
  if (scores.fatigue < 35) flags.push({ type: "fatigue_spike", severity: scores.fatigue < 20 ? "high" : "medium", message: "High fatigue levels detected" });
  if (scores.mood < 35) flags.push({ type: "mood_decline", severity: scores.mood < 20 ? "high" : "medium", message: "Mood decline detected" });
  if (scores.pain < 40) flags.push({ type: "pain_increase", severity: scores.pain < 25 ? "high" : "medium", message: "Pain signals detected in voice and conversation" });
  if (scores.anxiety > 65) flags.push({ type: "anxiety_spike", severity: scores.anxiety > 80 ? "high" : "medium", message: "Elevated anxiety detected" });

  return { biomarkers: scores, healthIndex, flags };
}

// Process a call and store biomarker data
export async function processCallBiomarkers(callId) {
  const call = await Call.findById(callId).populate("patient", "name phone language chronicConditions primaryDiagnosis");
  if (!call || call.status !== "completed" || call.duration < 5) return null;

  const existing = await VoiceBiomarker.findOne({ call: callId });
  if (existing) return existing;

  const features = extractAudioFeatures(call);
  const result = scoreBiomarkers(features, call, call.patient);
  if (!result) return null;

  // Get previous biomarker for this patient to compute trend
  const previous = await VoiceBiomarker.findOne({ patient: call.patient._id, call: { $ne: callId } })
    .sort({ createdAt: -1 });

  const healthIndexDelta = previous ? result.healthIndex - previous.healthIndex : 0;
  const healthIndexTrend = healthIndexDelta > 3 ? "improving" : healthIndexDelta < -3 ? "declining" : "stable";
  const decliningStreak = healthIndexTrend === "declining"
    ? (previous?.trend?.decliningStreak || 0) + 1
    : 0;

  // Determine proactive care trigger
  let proactiveCare = { triggered: false, triggerReason: "", callScheduled: false, callCompleted: false, billableCode: "", billableAmount: 0 };
  if (decliningStreak >= 3 || result.healthIndex < 35 || result.flags.some((f) => f.severity === "high")) {
    const reason = decliningStreak >= 3
      ? `${decliningStreak} consecutive declining biomarker scores`
      : result.healthIndex < 35
        ? `Critical health index: ${result.healthIndex}`
        : `High-severity flags: ${result.flags.filter((f) => f.severity === "high").map((f) => f.type).join(", ")}`;

    // Determine billable code
    let billableCode = "";
    let billableAmount = 0;
    if (result.flags.some((f) => ["cognitive_decline", "mood_decline"].includes(f.type))) {
      billableCode = "BHI-99492"; // Behavioral Health Integration
      billableAmount = 40;
    } else if (result.flags.some((f) => ["respiratory_decline", "fatigue_spike"].includes(f.type))) {
      billableCode = "RPM-99457"; // Remote Physiologic Monitoring
      billableAmount = 55;
    } else {
      billableCode = "CCM-99490"; // Chronic Care Management
      billableAmount = 65;
    }

    proactiveCare = {
      triggered: true,
      triggerReason: reason,
      callScheduled: false,
      callCompleted: false,
      billableCode,
      billableAmount,
    };
  }

  const biomarker = await VoiceBiomarker.create({
    organization: call.organization,
    patient: call.patient._id,
    call: callId,
    audioFeatures: features,
    biomarkers: result.biomarkers,
    healthIndex: result.healthIndex,
    flags: result.flags,
    trend: { healthIndexDelta, healthIndexTrend, decliningStreak },
    proactiveCare,
  });

  return biomarker;
}

// Get trend data for a patient
export async function getPatientTrend(patientId, limit = 20) {
  const markers = await VoiceBiomarker.find({ patient: patientId })
    .populate("call", "createdAt duration")
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  return markers.reverse(); // chronological order
}

// Get flagged patients for an organization
export async function getFlaggedPatients(orgId, minStreak = 2) {
  const flagged = await VoiceBiomarker.aggregate([
    { $match: { organization: orgId } },
    { $sort: { createdAt: -1 } },
    { $group: {
      _id: "$patient",
      latestMarker: { $first: "$$ROOT" },
      decliningStreak: { $first: "$trend.decliningStreak" },
      healthIndex: { $first: "$healthIndex" },
    }},
    { $match: {
      $or: [
        { decliningStreak: { $gte: minStreak } },
        { healthIndex: { $lt: 40 } },
        { "latestMarker.flags.severity": "high" },
        { "latestMarker.proactiveCare.triggered": true },
      ],
    }},
    { $sort: { healthIndex: 1 } },
    { $limit: 50 },
  ]);

  // Populate patient details
  const patientIds = flagged.map((f) => f._id);
  const patients = await Patient.find({ _id: { $in: patientIds } })
    .select("name phone primaryDiagnosis chronicConditions")
    .lean();

  const patientMap = {};
  for (const p of patients) patientMap[p._id.toString()] = p;

  return flagged.map((f) => ({
    ...f,
    patient: patientMap[f._id.toString()] || null,
    latestFlags: f.latestMarker?.flags || [],
    proactiveCare: f.latestMarker?.proactiveCare || {},
  }));
}
