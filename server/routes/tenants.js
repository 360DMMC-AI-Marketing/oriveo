import { Router } from "express";
import { protect } from "../middleware/auth.js";
import { requireActiveSubscription } from "../middleware/tenant.js";
import Organization from "../models/Organization.js";
import Subscription from "../models/Subscription.js";
import User from "../models/User.js";
import Patient from "../models/Patient.js";
import Call from "../models/Call.js";

const router = Router();

router.use(protect);
router.use(requireActiveSubscription);

function requireOrgAdmin(req, res, next) {
  if (req.user.role !== "admin" && !req.user.superAdmin) {
    return res.status(403).json({ message: "Organization admin access required" });
  }
  next();
}

router.get("/settings", async (req, res) => {
  try {
    const org = await Organization.findById(req.user.organization).lean();
    const sub = await Subscription.findOne({ organization: req.user.organization }).lean();
    if (!org) return res.status(404).json({ message: "Organization not found" });
    res.json({ organization: org, subscription: sub });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put("/settings", requireOrgAdmin, async (req, res) => {
  try {
    const allowed = ["name", "slug", "logo", "brandName", "phone", "address", "settings"];
    const update = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) update[key] = req.body[key];
    }
    const org = await Organization.findByIdAndUpdate(req.user.organization, update, { new: true }).lean();
    res.json({ organization: org });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/users", requireOrgAdmin, async (req, res) => {
  try {
    const users = await User.find({ organization: req.user.organization })
      .select("name email role isActive phone specialty language createdAt lastLogin")
      .sort({ createdAt: -1 })
      .lean();
    const sub = await Subscription.findOne({ organization: req.user.organization }).lean();
    res.json({ users, maxUsers: sub?.limits?.maxUsers || 5 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/users/invite", requireOrgAdmin, async (req, res) => {
  try {
    const { name, email, role } = req.body;
    if (!name || !email || !role) return res.status(400).json({ message: "Name, email, and role required" });
    const org = await Organization.findById(req.user.organization).lean();
    const sub = await Subscription.findOne({ organization: req.user.organization }).lean();
    const userCount = await User.countDocuments({ organization: req.user.organization, isActive: true });
    const max = sub?.limits?.maxUsers || 5;
    if (userCount >= max) return res.status(403).json({ message: `User limit reached (${max}). Upgrade your plan.` });
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: "User already exists" });
    const tempPassword = Math.random().toString(36).slice(2, 10) + "A1!";
    const user = await User.create({
      name, email, password: tempPassword, role: role || "doctor",
      organization: req.user.organization, isActive: true,
    });
    res.status(201).json({ user: { id: user._id, name: user.name, email: user.email, role: user.role, tempPassword } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put("/users/:userId/role", requireOrgAdmin, async (req, res) => {
  try {
    const { role } = req.body;
    if (!["admin", "doctor", "nurse", "receptionist"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }
    const user = await User.findOneAndUpdate(
      { _id: req.params.userId, organization: req.user.organization },
      { role },
      { new: true }
    ).select("name email role isActive");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put("/users/:userId/deactivate", requireOrgAdmin, async (req, res) => {
  try {
    const user = await User.findOneAndUpdate(
      { _id: req.params.userId, organization: req.user.organization },
      { isActive: false },
      { new: true }
    ).select("name email role isActive");
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/billing", async (req, res) => {
  try {
    const sub = await Subscription.findOne({ organization: req.user.organization }).lean();
    const callCount = await Call.countDocuments({ organization: req.user.organization });
    const patientCount = await Patient.countDocuments({ organization: req.user.organization });
    const userCount = await User.countDocuments({ organization: req.user.organization, isActive: true });
    res.json({
      subscription: sub,
      usage: { calls: callCount, patients: patientCount, users: userCount },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
