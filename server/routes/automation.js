import { Router } from "express";
import { protect, authorize } from "../middleware/auth.js";
import { scheduleAutomatedCall, executeAutomatedCall } from "../services/patientVoiceAgent.js";
import Call from "../models/Call.js";

const router = Router();

router.use(protect);

router.get("/calls", authorize("admin", "doctor", "nurse"), async (req, res) => {
  try {
    const { status, type, patientId } = req.query;
    const filter = { isAutomated: true };
    if (status) filter.status = status;
    if (type) filter.automatedType = type;
    if (patientId) filter.patient = patientId;

    const calls = await Call.find(filter)
      .populate("patient", "name phone")
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    res.json({ calls });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/schedule", authorize("admin", "doctor", "nurse"), async (req, res) => {
  try {
    const { patientId, type, scheduledAt, notes } = req.body;
    if (!patientId || !type) {
      return res.status(400).json({ message: "patientId and type are required" });
    }
    const validTypes = ["follow_up", "appointment_reminder", "medication_reminder", "post_discharge"];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ message: `Invalid type. Must be one of: ${validTypes.join(", ")}` });
    }
    const call = await scheduleAutomatedCall({
      patientId,
      type,
      scheduledAt: scheduledAt || new Date(),
      organizationId: req.user.organization,
      notes: notes || `Scheduled by ${req.user.name}`,
    });
    res.status(201).json({ call });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/execute/:id", authorize("admin", "doctor"), async (req, res) => {
  try {
    const result = await executeAutomatedCall(req.params.id);
    if (!result) {
      return res.status(400).json({ message: "Could not execute call" });
    }
    res.json({ message: "Call initiated", sid: result.sid });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
