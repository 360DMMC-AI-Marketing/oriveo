import { Router } from "express";
import AuditLog from "../models/AuditLog.js";
import { protect, authorize } from "../middleware/auth.js";

const router = Router();

router.use(protect);

router.get("/logs", authorize("admin"), async (req, res) => {
  try {
    const { action, userId, resourceType, days = 30, page = 1, limit = 50 } = req.query;
    const filter = {};

    if (action) filter.action = action;
    if (userId) filter.userId = userId;
    if (resourceType) filter.resourceType = resourceType;

    const since = new Date();
    since.setDate(since.getDate() - parseInt(days));
    filter.timestamp = { $gte: since };

    const total = await AuditLog.countDocuments(filter);
    const logs = await AuditLog.find(filter)
      .sort({ timestamp: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .populate("userId", "name email")
      .lean();

    res.json({
      logs,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/logs/actions", authorize("admin"), async (req, res) => {
  const actions = await AuditLog.distinct("action");
  res.json({ actions });
});

router.get("/logs/summary", authorize("admin"), async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const since = new Date();
    since.setDate(since.getDate() - days);

    const summary = await AuditLog.aggregate([
      { $match: { timestamp: { $gte: since } } },
      { $group: { _id: "$action", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const total = summary.reduce((acc, s) => acc + s.count, 0);
    res.json({ total, summary, days });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;