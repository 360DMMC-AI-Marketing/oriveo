import { Router } from "express";
import mongoose from "mongoose";
import crypto from "crypto";
import { protect, authorize } from "../middleware/auth.js";
import CarePlan from "../models/CarePlan.js";
import HomeVisit from "../models/HomeVisit.js";
import Patient from "../models/Patient.js";
import BookingToken from "../models/BookingToken.js";
import { sendFamilyLinkEmail } from "../services/emailService.js";

const router = Router();

router.use(protect);

const STAFF_ROLES = ["admin", "doctor", "nurse", "caregiver"];

function scopeByRole(filter, user) {
  if (user.superAdmin) return filter;
  if (user.role === "caregiver") {
    filter.caregiver = user._id;
  }
  return filter;
}

// ─── Care Plans ─────────────────────────────────────────

router.get("/care-plans", authorize(...STAFF_ROLES), async (req, res) => {
  try {
    const filter = scopeByRole({ ...req.tenantFilter }, req.user);
    if (req.query.patient) filter.patient = req.query.patient;
    if (req.query.status) filter.status = req.query.status;
    const plans = await CarePlan.find(filter)
      .populate("patient", "name phone email familyEmail")
      .populate("caregiver", "name email role")
      .populate("createdBy", "name")
      .sort({ createdAt: -1 });
    res.json({ carePlans: plans });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/care-plans/:id", authorize(...STAFF_ROLES), async (req, res) => {
  try {
    const plan = await CarePlan.findById(req.params.id)
      .populate("patient", "name phone email dob gender address")
      .populate("caregiver", "name email role")
      .populate("createdBy", "name");
    if (!plan) return res.status(404).json({ message: "Care plan not found" });
    res.json({ carePlan: plan });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/care-plans", authorize("admin", "doctor", "nurse"), async (req, res) => {
  try {
    const { patient, caregiver, title, description, startDate, endDate, tasks, medications, emergencyContacts, notes, status } = req.body;
    if (!patient || !mongoose.Types.ObjectId.isValid(patient)) {
      return res.status(400).json({ message: "Valid patient ID required" });
    }
    const plan = await CarePlan.create({
      organization: req.user.organization,
      patient,
      caregiver: caregiver || null,
      title: title || "Home Care Plan",
      description: description || "",
      startDate: startDate || new Date(),
      endDate: endDate || null,
      tasks: tasks || [],
      medications: medications || [],
      emergencyContacts: emergencyContacts || [],
      notes: notes || "",
      status: status || "active",
      createdBy: req.user._id,
    });
    res.status(201).json({ carePlan: plan });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/care-plans/:id", authorize("admin", "doctor", "nurse", "caregiver"), async (req, res) => {
  try {
    const plan = await CarePlan.findById(req.params.id);
    if (!plan) return res.status(404).json({ message: "Care plan not found" });
    const allowed = ["title", "description", "startDate", "endDate", "tasks", "medications", "emergencyContacts", "notes", "status", "caregiver"];
    for (const key of allowed) {
      if (req.body[key] !== undefined) plan[key] = req.body[key];
    }
    await plan.save();
    res.json({ carePlan: plan });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/care-plans/:id/tasks/:taskId/complete", authorize("admin", "doctor", "nurse", "caregiver"), async (req, res) => {
  try {
    const plan = await CarePlan.findById(req.params.id);
    if (!plan) return res.status(404).json({ message: "Care plan not found" });
    const task = plan.tasks.id(req.params.taskId);
    if (!task) return res.status(404).json({ message: "Task not found" });
    task.completed = true;
    task.completedAt = new Date();
    task.completedBy = req.user._id;
    await plan.save();
    res.json({ carePlan: plan });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete("/care-plans/:id", authorize("admin", "doctor"), async (req, res) => {
  try {
    await CarePlan.findByIdAndDelete(req.params.id);
    res.json({ message: "Care plan deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── Home Visits ─────────────────────────────────────────

router.get("/visits", authorize(...STAFF_ROLES), async (req, res) => {
  try {
    const filter = scopeByRole({ ...req.tenantFilter }, req.user);
    if (req.query.patient) filter.patient = req.query.patient;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.start && req.query.end) {
      filter.scheduledAt = { $gte: new Date(req.query.start), $lte: new Date(req.query.end) };
    }
    const visits = await HomeVisit.find(filter)
      .populate("patient", "name phone email address")
      .populate("caregiver", "name email role")
      .populate("carePlan", "title")
      .sort({ scheduledAt: -1 });
    res.json({ visits });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/visits/:id", authorize(...STAFF_ROLES), async (req, res) => {
  try {
    const visit = await HomeVisit.findById(req.params.id)
      .populate("patient", "name phone email address dob gender")
      .populate("caregiver", "name email role")
      .populate("carePlan", "title");
    if (!visit) return res.status(404).json({ message: "Visit not found" });
    res.json({ visit });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/visits", authorize("admin", "doctor", "nurse"), async (req, res) => {
  try {
    const { patient, caregiver, carePlan, scheduledAt } = req.body;
    if (!patient || !mongoose.Types.ObjectId.isValid(patient) || !scheduledAt) {
      return res.status(400).json({ message: "Valid patient ID and scheduledAt required" });
    }
    const visit = await HomeVisit.create({
      organization: req.user.organization,
      patient,
      caregiver: caregiver || null,
      carePlan: carePlan || null,
      scheduledAt: new Date(scheduledAt),
      createdBy: req.user._id,
    });
    res.status(201).json({ visit });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/visits/:id/check-in", authorize("admin", "doctor", "nurse", "caregiver"), async (req, res) => {
  try {
    const visit = await HomeVisit.findById(req.params.id);
    if (!visit) return res.status(404).json({ message: "Visit not found" });
    if (visit.status === "completed") return res.status(400).json({ message: "Visit already completed" });
    visit.status = "in-progress";
    visit.checkInAt = new Date();
    if (req.body.lat !== undefined && req.body.lng !== undefined) {
      visit.geoCheckIn.lat = req.body.lat;
      visit.geoCheckIn.lng = req.body.lng;
      visit.geoCheckIn.address = req.body.address || "";
    }
    if (req.body.address) visit.geoCheckIn.address = req.body.address;
    await visit.save();
    res.json({ visit });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/visits/:id/check-out", authorize("admin", "doctor", "nurse", "caregiver"), async (req, res) => {
  try {
    const visit = await HomeVisit.findById(req.params.id);
    if (!visit) return res.status(404).json({ message: "Visit not found" });
    if (visit.status === "completed") return res.status(400).json({ message: "Visit already completed" });
    visit.status = "completed";
    visit.checkOutAt = new Date();
    if (req.body.vitals) visit.vitals = { ...visit.vitals.toObject(), ...req.body.vitals };
    if (req.body.soap) visit.soap = { ...visit.soap.toObject(), ...req.body.soap };
    if (req.body.tasksCompleted) visit.tasksCompleted = req.body.tasksCompleted;
    if (req.body.billableCodes) visit.billableCodes = req.body.billableCodes;
    if (req.body.notes !== undefined) visit.notes = req.body.notes;
    if (visit.vitals?.heartRate || visit.vitals?.spo2 || visit.vitals?.bloodPressure || visit.vitals?.temperature || visit.vitals?.weight) {
      const codes = visit.billableCodes || [];
      const additions = [];
      if (!codes.includes("RPM")) additions.push("RPM");
      if (!codes.includes("CCM")) additions.push("CCM");
      visit.billableCodes = [...new Set([...codes, ...additions])];
    }
    await visit.save();
    res.json({ visit });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/visits/:id", authorize("admin", "doctor", "nurse"), async (req, res) => {
  try {
    const visit = await HomeVisit.findById(req.params.id);
    if (!visit) return res.status(404).json({ message: "Visit not found" });
    const allowed = ["caregiver", "carePlan", "scheduledAt", "status", "notes", "vitals", "soap", "billableCodes"];
    for (const key of allowed) {
      if (req.body[key] !== undefined) visit[key] = req.body[key];
    }
    await visit.save();
    res.json({ visit });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete("/visits/:id", authorize("admin", "doctor"), async (req, res) => {
  try {
    await HomeVisit.findByIdAndDelete(req.params.id);
    res.json({ message: "Visit deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── Family Portal (token-based, read-only) ──────────────

router.post("/family-link", authorize("admin", "doctor", "nurse"), async (req, res) => {
  try {
    const { patientId } = req.body;
    if (!patientId || !mongoose.Types.ObjectId.isValid(patientId)) {
      return res.status(400).json({ message: "Valid patient ID required" });
    }
    const patient = await Patient.findOne({ _id: patientId, organization: req.user.organization });
    if (!patient) return res.status(404).json({ message: "Patient not found" });
    const token = crypto.randomBytes(24).toString("hex");
    await BookingToken.create({
      patient: patient._id,
      organization: req.user.organization,
      token,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });
    const baseUrl = process.env.CLIENT_URL || `${req.protocol}://${req.get("host")}`;
    const familyLink = `${baseUrl}/family/${token}`;
    let emailed = false;
    let emailReason = "";
    if (patient.familyEmail) {
      const emailResult = await sendFamilyLinkEmail({
        toEmail: patient.familyEmail,
        toName: patient.name,
        patientName: patient.name,
        familyLink,
      });
      emailed = emailResult.sent;
      emailReason = emailResult.reason || "";
    } else {
      emailReason = "No family email on patient record";
    }
    res.status(201).json({ familyLink, emailed, message: emailed ? `Family link sent to ${patient.familyEmail} (valid 30 days)` : "Family link generated (valid 30 days)" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/family/:token", async (req, res) => {
  try {
    const record = await BookingToken.findOne({ token: req.params.token, used: false });
    if (!record) return res.status(404).json({ message: "Invalid or expired link" });
    if (record.expiresAt && record.expiresAt < new Date()) {
      return res.status(410).json({ message: "Link expired" });
    }
    const patient = await Patient.findById(record.patient).select("name");
    const carePlan = await CarePlan.findOne({ patient: record.patient, status: { $ne: "cancelled" } })
      .populate("caregiver", "name")
      .sort({ createdAt: -1 })
      .lean();
    const visits = await HomeVisit.find({ patient: record.patient })
      .populate("caregiver", "name")
      .sort({ scheduledAt: -1 })
      .limit(20)
      .lean();
    res.json({
      patient: patient?.name || "Patient",
      carePlan: carePlan
        ? {
            title: carePlan.title,
            status: carePlan.status,
            caregiver: carePlan.caregiver?.name || "To be assigned",
            medications: carePlan.medications || [],
            tasks: (carePlan.tasks || []).map((t) => ({ title: t.title, completed: t.completed })),
            notes: carePlan.notes,
          }
        : null,
      visits: (visits || []).map((v) => ({
        scheduledAt: v.scheduledAt,
        status: v.status,
        caregiver: v.caregiver?.name || "To be assigned",
        vitals: v.vitals,
        soap: v.soap,
        notes: v.notes,
      })),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
