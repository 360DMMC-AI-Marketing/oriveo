import { Router } from "express";
import crypto from "crypto";
import rateLimit from "express-rate-limit";
import { signup, login, getMe, updateProfile, changePassword, revokeAllSessions } from "../controllers/authController.js";
import { protect, authorize } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { inviteSchema, loginSchema, signupSchema } from "../validators/auth.js";
import User from "../models/User.js";
import { sendInviteEmail } from "../services/emailService.js";

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: "Too many login attempts, please try again after 15 minutes" },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/signup", validate(signupSchema), signup);
router.post("/login", loginLimiter, validate(loginSchema), login);
router.get("/me", protect, getMe);
router.put("/profile", protect, updateProfile);

router.post("/change-password", protect, changePassword);
router.post("/logout", protect, revokeAllSessions);
router.post("/revoke-sessions", protect, revokeAllSessions);

router.post("/invite", protect, authorize("admin"), validate(inviteSchema), async (req, res) => {
  try {
    const { email, name, role } = req.body;
    if (!email || !name) return res.status(400).json({ message: "Email and name required" });
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: "User already exists with this email" });
    const tempPassword = crypto.randomBytes(12).toString("hex");
    const user = await User.create({ name, email, password: tempPassword, role: role || "doctor", isActive: true, organization: req.user?.organization || null });

    const emailResult = await sendInviteEmail({
      toEmail: email,
      toName: name,
      tempPassword,
      companyName: process.env.PRACTICE_NAME || "Oriveo",
      invitedByName: req.user?.name,
    });

    res.status(201).json({
      message: "User invited successfully",
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      emailed: emailResult.sent,
      tempPassword: emailResult.sent ? null : tempPassword,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/team", protect, authorize("admin"), async (req, res) => {
  try {
    const users = await User.find({}, "name email role isActive createdAt").sort({ createdAt: -1 });
    res.json({ users });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete("/team/:id", protect, authorize("admin"), async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ message: "User deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
