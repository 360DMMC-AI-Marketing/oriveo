import { Router } from "express";
import { z } from "zod";
import Appointment from "../models/Appointment.js";
import { protect, authorize } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { createAppointmentSchema } from "../validators/appointment.js";

const router = Router();

router.use(protect);

router.get("/", async (req, res) => {
  try {
    const query = {};
    if (req.query.patient) query.patient = req.query.patient;
    if (req.query.status) query.status = req.query.status;
    if (req.query.start && req.query.end) {
      query.date = { $gte: new Date(req.query.start), $lte: new Date(req.query.end) };
    }
    if (req.user.role === "doctor" || req.user.role === "nurse") {
      const patients = await (await import("../models/Patient.js")).default.find({ assignedDoctor: req.user._id }).select("_id");
      query.patient = { $in: patients.map((p) => p._id) };
    }
    const appointments = await Appointment.find(query)
      .populate("patient", "name phone language")
      .populate("bookedBy", "name")
      .sort({ date: 1 });
    res.json({ appointments });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/stats", async (req, res) => {
  try {
    const match = { ...req.tenantFilter };
    if (req.user.role === "doctor" || req.user.role === "nurse") {
      const patients = await (await import("../models/Patient.js")).default.find({ assignedDoctor: req.user._id }).select("_id");
      match.patient = { $in: patients.map((p) => p._id) };
    }

    const stats = await Appointment.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const total = stats.reduce((s, g) => s + g.count, 0);
    const noShow = stats.find((s) => s._id === "no-show")?.count || 0;
    const cancelled = stats.find((s) => s._id === "cancelled")?.count || 0;
    const completed = stats.find((s) => s._id === "completed")?.count || 0;
    const confirmed = stats.find((s) => s._id === "confirmed")?.count || 0;
    const scheduled = stats.find((s) => s._id === "scheduled")?.count || 0;
    const validTotal = total - cancelled;
    const noShowRate = validTotal > 0 ? Math.round((noShow / validTotal) * 100 * 10) / 10 : 0;

    const costPerNoShow = parseInt(process.env.NO_SHOW_COST || "200");
    const estimatedSavings = Math.round(scheduled * costPerNoShow * 0.7);

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 3600 * 1000);
    const trend = await Appointment.aggregate([
      { $match: { ...match, date: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          total: { $sum: 1 },
          noShows: { $sum: { $cond: [{ $eq: ["$status", "no-show"] }, 1, 0] } },
          completed: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
        },
      },
      { $sort: { _id: 1 } },
      { $limit: 30 },
    ]);

    res.json({
      stats,
      total,
      noShow,
      cancelled,
      completed,
      confirmed,
      scheduled,
      noShowRate,
      estimatedSavings,
      trend,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate("patient", "name phone email language")
      .populate("bookedBy", "name")
      .populate("call");
    if (!appointment) return res.status(404).json({ message: "Appointment not found" });
    res.json({ appointment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/", authorize("admin", "doctor", "receptionist"), validate(createAppointmentSchema), async (req, res) => {
  try {
    const appointment = await Appointment.create({
      ...req.body,
      organization: req.user.organization || null,
      bookedBy: req.user._id,
    });
    const populated = await appointment.populate("patient", "name phone");
    res.status(201).json({ appointment: populated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/batch", authorize("admin", "doctor", "receptionist"), async (req, res) => {
  try {
    const { patientIds, ...data } = req.body;
    if (!patientIds || !Array.isArray(patientIds) || patientIds.length === 0) {
      return res.status(400).json({ message: "patientIds array required" });
    }
    const appts = await Appointment.create(
      patientIds.map((pid) => ({
        ...data,
        organization: req.user.organization || null,
        patient: pid,
        bookedBy: req.user._id,
      }))
    );
    const populated = await Appointment.populate(appts, { path: "patient", select: "name phone" });
    res.status(201).json({ appointments: populated, count: populated.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/:id", authorize("admin", "doctor", "nurse"), async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    ).populate("patient", "name phone");
    if (!appointment) return res.status(404).json({ message: "Appointment not found" });
    res.json({ appointment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

const statusSchema = z.object({ status: z.enum(["scheduled", "confirmed", "in-progress", "completed", "cancelled", "no-show"]) });

router.put("/:id/status", authorize("admin", "doctor", "nurse"), validate(statusSchema), async (req, res) => {
  try {
    const { status } = req.body;
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate("patient", "name phone");
    if (!appointment) return res.status(404).json({ message: "Appointment not found" });
    res.json({ appointment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete("/:id", authorize("admin"), async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndDelete(req.params.id);
    if (!appointment) return res.status(404).json({ message: "Appointment not found" });
    res.json({ message: "Appointment cancelled" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
