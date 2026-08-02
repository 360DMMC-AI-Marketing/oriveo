import { Router } from "express";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import Patient from "../models/Patient.js";
import Appointment from "../models/Appointment.js";
import LabResult from "../models/LabResult.js";
import Prescription from "../models/Prescription.js";
import Organization from "../models/Organization.js";

const router = Router();

async function loadPatient(req) {
  const token = req.headers.authorization?.startsWith("Bearer ")
    ? req.headers.authorization.split(" ")[1]
    : null;
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.patientId) return null;
    return await Patient.findById(decoded.patientId).populate("organization", "name brandName");
  } catch {
    return null;
  }
}

const patientOnly = async (req, res, next) => {
  const patient = await loadPatient(req);
  if (!patient) return res.status(401).json({ message: "Not authorized" });
  req.patient = patient;
  next();
};

function sanitize(patient) {
  return {
    _id: patient._id,
    name: patient.name,
    email: patient.email,
    phone: patient.phone,
    dob: patient.dob,
    gender: patient.gender,
    language: patient.language,
    clinicName: patient.organization?.name || patient.organization?.brandName || "Your clinic",
  };
}

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Email and password required" });
    const patient = await Patient.findOne({ email: email.toLowerCase() });
    if (!patient || !patient.portalEnabled) {
      return res.status(401).json({ message: "No portal account found for this email" });
    }
    const ok = await patient.comparePortalPassword(password);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });
    const token = jwt.sign({ patientId: patient._id, scope: "patient" }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, patient: sanitize(patient) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/me", patientOnly, async (req, res) => {
  res.json({ patient: sanitize(req.patient) });
});

router.get("/appointments", patientOnly, async (req, res) => {
  const appointments = await Appointment.find({ patient: req.patient._id })
    .populate("provider", "name")
    .sort({ date: -1 })
    .limit(20);
  res.json({ appointments });
});

router.get("/labs", patientOnly, async (req, res) => {
  const results = await LabResult.find({ patient: req.patient._id })
    .sort({ orderedAt: -1 })
    .limit(20);
  res.json({ results });
});

router.get("/prescriptions", patientOnly, async (req, res) => {
  const prescriptions = await Prescription.find({ patient: req.patient._id })
    .sort({ createdAt: -1 })
    .limit(20);
  res.json({ prescriptions });
});

router.post("/change-password", patientOnly, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ message: "Both passwords required" });
    if (newPassword.length < 6) return res.status(400).json({ message: "New password must be at least 6 characters" });
    const ok = await req.patient.comparePortalPassword(currentPassword);
    if (!ok) return res.status(401).json({ message: "Current password is incorrect" });
    req.patient.portalPassword = await bcrypt.hash(newPassword, 10);
    await req.patient.save();
    res.json({ message: "Password updated" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email required" });
    const patient = await Patient.findOne({ email: email.toLowerCase(), portalEnabled: true });
    if (patient) {
      patient.portalPasswordResetToken = crypto.randomBytes(20).toString("hex");
      patient.portalPasswordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
      await patient.save();
    }
    res.json({ message: "If an account exists for this email, a reset link was generated." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) return res.status(400).json({ message: "Token and new password required" });
    if (newPassword.length < 6) return res.status(400).json({ message: "Password must be at least 6 characters" });
    const patient = await Patient.findOne({
      portalPasswordResetToken: token,
      portalPasswordResetExpires: { $gt: new Date() },
    });
    if (!patient) return res.status(400).json({ message: "Invalid or expired reset token" });
    patient.portalPassword = await bcrypt.hash(newPassword, 10);
    patient.portalPasswordResetToken = "";
    patient.portalPasswordResetExpires = null;
    patient.portalEnabled = true;
    await patient.save();
    res.json({ message: "Password reset — you can now log in" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export { patientOnly };
export default router;
