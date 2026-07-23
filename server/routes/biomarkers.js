import { Router } from "express";
import { protect, authorize } from "../middleware/auth.js";
import VoiceBiomarker from "../models/VoiceBiomarker.js";
import { processCallBiomarkers, getPatientTrend, getFlaggedPatients } from "../services/biomarkerService.js";

const router = Router();
router.use(protect);

// GET /biomarkers/patient/:patientId - trend data for a patient
router.get("/patient/:patientId", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const markers = await getPatientTrend(req.params.patientId, limit);
    res.json({ markers });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /biomarkers/flagged - flagged patients for org
router.get("/flagged", authorize("admin", "doctor"), async (req, res) => {
  try {
    const minStreak = parseInt(req.query.minStreak) || 2;
    const flagged = await getFlaggedPatients(req.user.organization, minStreak);
    res.json({ flagged });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /biomarkers/stats - org-wide biomarker stats
router.get("/stats", authorize("admin", "doctor"), async (req, res) => {
  try {
    const orgId = req.user.organization;
    const stats = await VoiceBiomarker.aggregate([
      { $match: { organization: orgId } },
      { $group: {
        _id: null,
        totalCalls: { $sum: 1 },
        avgHealthIndex: { $avg: "$healthIndex" },
        flaggedCount: { $sum: { $cond: ["$proactiveCare.triggered", 1, 0] } },
        totalBillable: { $sum: { $cond: ["$proactiveCare.triggered", "$proactiveCare.billableAmount", 0] } },
        decliningCount: { $sum: { $cond: [{ $eq: ["$trend.healthIndexTrend", "declining"] }, 1, 0] } },
        improvingCount: { $sum: { $cond: [{ $eq: ["$trend.healthIndexTrend", "improving"] }, 1, 0] } },
      }},
    ]);

    const recentFlags = await VoiceBiomarker.countDocuments({
      organization: orgId,
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      "flags.0": { $exists: true },
    });

    const result = stats[0] || {
      totalCalls: 0, avgHealthIndex: 0, flaggedCount: 0, totalBillable: 0,
      decliningCount: 0, improvingCount: 0,
    };

    res.json({ ...result, recentFlags });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /biomarkers/process/:callId - process a completed call
router.post("/process/:callId", authorize("admin", "doctor"), async (req, res) => {
  try {
    const marker = await processCallBiomarkers(req.params.callId);
    if (!marker) return res.status(400).json({ message: "Call not eligible for biomarker processing" });
    res.json({ marker });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /biomarkers/process-batch - process all unprocessed calls
router.post("/process-batch", authorize("admin"), async (req, res) => {
  try {
    const Call = (await import("../models/Call.js")).default;
    const calls = await Call.find({
      organization: req.user.organization,
      status: "completed",
      duration: { $gte: 5 },
    }).select("_id").lean();

    const processed = [];
    for (const call of calls) {
      const exists = await VoiceBiomarker.findOne({ call: call._id });
      if (!exists) {
        const marker = await processCallBiomarkers(call._id);
        if (marker) processed.push(marker._id);
      }
    }

    res.json({ processed: processed.length, total: calls.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
