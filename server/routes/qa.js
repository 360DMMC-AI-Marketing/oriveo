import { Router } from "express";
import Call from "../models/Call.js";
import { scoreCall } from "../services/qaScoring.js";
import { protect, authorize } from "../middleware/auth.js";

const router = Router();

router.use(protect);

router.get("/scores", async (req, res) => {
  try {
    const query = { "qaScore.overall": { $exists: true, $ne: null } };
    if (req.query.status) query.status = req.query.status;
    const calls = await Call.find(query)
      .populate("patient", "name phone")
      .select("qaScore duration createdAt status patient")
      .sort({ "qaScore.scoredAt": -1 });
    const avg = calls.reduce((s, c) => s + (c.qaScore?.overall || 0), 0) / (calls.length || 1);
    res.json({
      scores: calls,
      summary: {
        total: calls.length,
        averageOverall: Math.round(avg),
        averageAccuracy: Math.round(calls.reduce((s, c) => s + (c.qaScore?.scores?.accuracy || 0), 0) / (calls.length || 1)),
        averageEmpathy: Math.round(calls.reduce((s, c) => s + (c.qaScore?.scores?.empathy || 0), 0) / (calls.length || 1)),
        averageProfessionalism: Math.round(calls.reduce((s, c) => s + (c.qaScore?.scores?.professionalism || 0), 0) / (calls.length || 1)),
        averageAdherence: Math.round(calls.reduce((s, c) => s + (c.qaScore?.scores?.adherence || 0), 0) / (calls.length || 1)),
        averageResolution: Math.round(calls.reduce((s, c) => s + (c.qaScore?.scores?.resolution || 0), 0) / (calls.length || 1)),
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/score/:callId", authorize("admin", "doctor"), async (req, res) => {
  try {
    const call = await Call.findById(req.params.callId);
    if (!call) {
      return res.status(404).json({ message: "Call not found" });
    }
    const result = await scoreCall(call._id, call.transcript, call.aiSummary);
    if (result.error) {
      return res.status(500).json({ message: result.error });
    }
    call.qaScore = {
      scores: result.scores,
      overall: result.overall,
      strengths: result.strengths,
      weaknesses: result.weaknesses,
      summary: result.summary,
      scoredAt: new Date(),
    };
    await call.save();
    res.json({ call: { _id: call._id, qaScore: call.qaScore } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/score-all", authorize("admin"), async (req, res) => {
  try {
    const calls = await Call.find({
      status: "completed",
      $or: [
        { "qaScore.overall": { $exists: false } },
        { "qaScore": null },
      ],
    }).limit(50);
    let scored = 0;
    for (const call of calls) {
      const result = await scoreCall(call._id, call.transcript, call.aiSummary);
      if (!result.error) {
        call.qaScore = {
          scores: result.scores,
          overall: result.overall,
          strengths: result.strengths,
          weaknesses: result.weaknesses,
          summary: result.summary,
          scoredAt: new Date(),
        };
        await call.save();
        scored++;
      }
    }
    res.json({ scored, total: calls.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/trends", async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const since = new Date();
    since.setDate(since.getDate() - days);

    const calls = await Call.find({
      "qaScore.overall": { $exists: true, $ne: null },
      "qaScore.scoredAt": { $gte: since },
    }).sort({ "qaScore.scoredAt": 1 });

    const dailyMap = new Map();
    for (const call of calls) {
      const date = call.qaScore.scoredAt.toISOString().split("T")[0];
      if (!dailyMap.has(date)) {
        dailyMap.set(date, { date, count: 0, totalScore: 0, scores: [] });
      }
      const entry = dailyMap.get(date);
      entry.count++;
      entry.totalScore += call.qaScore.overall || 0;
      entry.scores.push({
        accuracy: call.qaScore.scores?.accuracy || 0,
        empathy: call.qaScore.scores?.empathy || 0,
      });
    }

    const trends = Array.from(dailyMap.values()).map((entry) => ({
      date: entry.date,
      avgScore: Math.round(entry.totalScore / entry.count),
      callCount: entry.count,
    }));

    res.json({ trends });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
