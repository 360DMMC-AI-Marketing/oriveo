import { Router } from "express";
import mongoose from "mongoose";
import { protect, authorize } from "../middleware/auth.js";
import Prescription from "../models/Prescription.js";
import Patient from "../models/Patient.js";
import User from "../models/User.js";
import { assertPatientInOrg } from "../utils/tenant.js";

const router = Router();

router.use(protect);

router.get("/", async (req, res) => {
  try {
    const filter = { ...req.tenantFilter };
    if (req.query.patient) filter.patient = req.query.patient;
    if (req.query.status) filter.status = req.query.status;
    if (req.user.role === "doctor" || req.user.role === "nurse") {
      const patients = await Patient.find({ assignedDoctor: req.user._id }).select("_id");
      filter.patient = { $in: patients.map((p) => p._id) };
    }
    const prescriptions = await Prescription.find(filter)
      .populate("patient", "name phone")
      .populate("prescribedBy", "name")
      .sort({ createdAt: -1 });
    res.json({ prescriptions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/stats", async (req, res) => {
  try {
    const match = { ...req.tenantFilter };
    const [total, active, filled, expired] = await Promise.all([
      Prescription.countDocuments(match),
      Prescription.countDocuments({ ...match, status: "active" }),
      Prescription.countDocuments({ ...match, status: "filled" }),
      Prescription.countDocuments({ ...match, status: "expired" }),
    ]);
    res.json({ total, active, filled, expired });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const prescription = await Prescription.findOne({ _id: req.params.id, ...req.tenantFilter })
      .populate("patient", "name dob gender")
      .populate("prescribedBy", "name title")
      .populate("signedBy", "name title");
    if (!prescription) return res.status(404).json({ message: "Prescription not found" });
    res.json({ prescription });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/", authorize("admin", "doctor"), async (req, res) => {
  try {
    const { patient, medication, dosage, route, frequency, instructions, quantity, refills, startDate, endDate } = req.body;
    if (!patient || !mongoose.Types.ObjectId.isValid(patient)) {
      return res.status(400).json({ message: "Valid patient ID required" });
    }
    if (!medication || !medication.trim()) {
      return res.status(400).json({ message: "Medication name required" });
    }
    if (!(await assertPatientInOrg(req, patient))) {
      return res.status(404).json({ message: "Patient not found" });
    }
    const prescription = await Prescription.create({
      organization: req.user.organization,
      patient,
      prescribedBy: req.user._id,
      medication: medication.trim(),
      dosage: dosage || "",
      route: route || "",
      frequency: frequency || "",
      instructions: instructions || "",
      quantity: quantity || null,
      refills: refills || 0,
      startDate: startDate || new Date(),
      endDate: endDate || null,
      createdBy: req.user._id,
    });
    res.status(201).json({ prescription });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/:id", authorize("admin", "doctor"), async (req, res) => {
  try {
    const prescription = await Prescription.findOne({ _id: req.params.id, ...req.tenantFilter });
    if (!prescription) return res.status(404).json({ message: "Prescription not found" });
    const allowed = ["medication", "dosage", "route", "frequency", "instructions", "quantity", "refills", "startDate", "endDate", "status"];
    for (const key of allowed) {
      if (req.body[key] !== undefined) prescription[key] = req.body[key];
    }
    await prescription.save();
    res.json({ prescription });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/:id/sign", authorize("admin", "doctor"), async (req, res) => {
  try {
    const prescription = await Prescription.findOne({ _id: req.params.id, ...req.tenantFilter });
    if (!prescription) return res.status(404).json({ message: "Prescription not found" });
    const signature = req.body.signatureName || req.user.digitalSignature || req.user.name;
    prescription.isSigned = true;
    prescription.signedBy = req.user._id;
    prescription.signedAt = new Date();
    prescription.signatureName = signature;
    await prescription.save();
    res.json({ prescription });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/:id/renew", authorize("admin", "doctor"), async (req, res) => {
  try {
    const original = await Prescription.findOne({ _id: req.params.id, ...req.tenantFilter });
    if (!original) return res.status(404).json({ message: "Prescription not found" });
    const renewed = await Prescription.create({
      organization: original.organization,
      patient: original.patient,
      prescribedBy: req.user._id,
      medication: original.medication,
      dosage: original.dosage,
      route: original.route,
      frequency: original.frequency,
      instructions: original.instructions,
      quantity: original.quantity,
      refills: original.refills,
      startDate: new Date(),
      createdBy: req.user._id,
    });
    original.status = "expired";
    await original.save();
    res.status(201).json({ prescription: renewed });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete("/:id", authorize("admin", "doctor"), async (req, res) => {
  try {
    await Prescription.findOneAndDelete({ _id: req.params.id, ...req.tenantFilter });
    res.json({ message: "Prescription deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
