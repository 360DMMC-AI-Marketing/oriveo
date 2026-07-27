import { Router } from "express";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import speakeasy from "speakeasy";
import QRCode from "qrcode";
import rateLimit from "express-rate-limit";
import { signup, login, getMe, updateProfile, changePassword, revokeAllSessions } from "../controllers/authController.js";
import { protect, authorize } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { inviteSchema, loginSchema, signupSchema } from "../validators/auth.js";
import User from "../models/User.js";
import { sendInviteEmail, sendPasswordResetEmail, sendVerificationEmail } from "../services/emailService.js";

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: "Too many login attempts, please try again after 15 minutes" },
  standardHeaders: true,
  legacyHeaders: false,
});

const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { message: "Too many requests, please try again after 15 minutes" },
  standardHeaders: true,
  legacyHeaders: false,
});

const twoFactorVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { message: "Too many verification attempts, please try again after 15 minutes" },
  standardHeaders: true,
  legacyHeaders: false,
});

const CLIENT_URL = process.env.CLIENT_URL || "https://2.25.167.45:8443";

router.post("/signup", validate(signupSchema), signup);
router.post("/login", loginLimiter, validate(loginSchema), login);
router.get("/me", protect, getMe);
router.put("/profile", protect, updateProfile);

router.post("/change-password", protect, changePassword);
router.post("/logout", protect, revokeAllSessions);
router.post("/revoke-sessions", protect, revokeAllSessions);

// ─── Forgot Password ────────────────────────────────────────────

router.post("/forgot-password", forgotPasswordLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await User.findOne({ email: email.toLowerCase() });

    if (user) {
      const rawToken = crypto.randomBytes(32).toString("hex");
      const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

      user.passwordResetToken = hashedToken;
      user.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1 hour
      await user.save({ validateModifiedOnly: true });

      const resetUrl = `${CLIENT_URL}/reset-password?token=${rawToken}`;

      await sendPasswordResetEmail({
        toEmail: user.email,
        toName: user.name,
        resetUrl,
        companyName: process.env.PRACTICE_NAME || "Oriveo",
      });
    }

    res.json({ message: "If an account exists with that email, a reset link has been sent." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/reset-password", async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ message: "Token and password are required" });
    if (password.length < 6) return res.status(400).json({ message: "Password must be at least 6 characters" });

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) return res.status(400).json({ message: "Invalid or expired reset token" });

    user.password = password;
    user.passwordResetToken = "";
    user.passwordResetExpires = null;
    user.tokenVersion += 1;
    await user.save();

    res.json({ message: "Password has been reset successfully. You can now sign in." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── Email Verification ─────────────────────────────────────────

router.post("/verify-email", async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ message: "Token is required" });

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() },
    });

    if (!user) return res.status(400).json({ message: "Invalid or expired verification token" });

    user.emailVerified = true;
    user.emailVerificationToken = "";
    user.emailVerificationExpires = null;
    await user.save({ validateModifiedOnly: true });

    res.json({ message: "Email verified successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/resend-verification", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await User.findOne({ email: email.toLowerCase() });

    if (user && !user.emailVerified) {
      const rawToken = crypto.randomBytes(32).toString("hex");
      const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

      user.emailVerificationToken = hashedToken;
      user.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
      await user.save({ validateModifiedOnly: true });

      const verifyUrl = `${CLIENT_URL}/verify-email?token=${rawToken}`;

      await sendVerificationEmail({
        toEmail: user.email,
        toName: user.name,
        verifyUrl,
        companyName: process.env.PRACTICE_NAME || "Oriveo",
      });
    }

    res.json({ message: "If an account exists with that email, a verification link has been sent." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── Two-Factor Authentication ──────────────────────────────────

router.post("/2fa/setup", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.twoFactorEnabled) {
      return res.status(400).json({ message: "2FA is already enabled. Disable it first." });
    }

    const secret = speakeasy.generateSecret({
      name: `Oriveo:${user.email}`,
      issuer: "Oriveo",
    });

    // Store secret temporarily (not yet enabled)
    user.twoFactorSecret = secret.base32;
    await user.save({ validateModifiedOnly: true });

    const qrCodeDataUrl = await QRCode.toDataURL(secret.otpauth_url);

    // Generate backup codes
    const rawBackupCodes = [];
    for (let i = 0; i < 10; i++) {
      rawBackupCodes.push(crypto.randomBytes(4).toString("hex"));
    }

    // Store hashed backup codes
    const hashedCodes = [];
    for (const code of rawBackupCodes) {
      hashedCodes.push(await bcrypt.hash(code, 10));
    }
    user.twoFactorBackupCodes = hashedCodes;
    await user.save({ validateModifiedOnly: true });

    res.json({
      secret: secret.base32,
      qrCode: qrCodeDataUrl,
      backupCodes: rawBackupCodes,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/2fa/enable", protect, async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ message: "Token is required" });

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.twoFactorSecret) {
      return res.status(400).json({ message: "Run 2FA setup first" });
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: "base32",
      token,
      window: 1,
    });

    if (!verified) {
      return res.status(400).json({ message: "Invalid verification code" });
    }

    user.twoFactorEnabled = true;
    await user.save({ validateModifiedOnly: true });

    res.json({ message: "Two-factor authentication enabled" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/2fa/disable", protect, async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) return res.status(400).json({ message: "Password is required to disable 2FA" });

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.twoFactorEnabled) {
      return res.status(400).json({ message: "2FA is not enabled" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ message: "Incorrect password" });

    user.twoFactorEnabled = false;
    user.twoFactorSecret = "";
    user.twoFactorBackupCodes = [];
    await user.save({ validateModifiedOnly: true });

    res.json({ message: "Two-factor authentication disabled" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/2fa/verify", twoFactorVerifyLimiter, async (req, res) => {
  try {
    const { email, token, backupCode } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !user.twoFactorEnabled) {
      return res.status(400).json({ message: "Invalid request" });
    }

    let verified = false;

    if (backupCode) {
      // Check backup codes
      for (let i = 0; i < user.twoFactorBackupCodes.length; i++) {
        if (await bcrypt.compare(backupCode, user.twoFactorBackupCodes[i])) {
          verified = true;
          // Remove used backup code
          user.twoFactorBackupCodes.splice(i, 1);
          await user.save({ validateModifiedOnly: true });
          break;
        }
      }
    } else if (token) {
      verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: "base32",
        token,
        window: 1,
      });
    }

    if (!verified) {
      return res.status(401).json({ message: "Invalid verification code" });
    }

    // Generate JWT (same as login)
    const jwtToken = jwt.sign(
      { id: user._id, tokenVersion: user.tokenVersion },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );

    const populatedUser = await User.findById(user._id).populate("organization", "name slug specialty clinicType clinicSize billingSetup");

    res.json({ token: jwtToken, user: populatedUser });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/2fa/regenerate-backup-codes", protect, async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) return res.status(400).json({ message: "Password is required" });

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.twoFactorEnabled) {
      return res.status(400).json({ message: "2FA is not enabled" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ message: "Incorrect password" });

    const rawBackupCodes = [];
    for (let i = 0; i < 10; i++) {
      rawBackupCodes.push(crypto.randomBytes(4).toString("hex"));
    }

    const hashedCodes = [];
    for (const code of rawBackupCodes) {
      hashedCodes.push(await bcrypt.hash(code, 10));
    }
    user.twoFactorBackupCodes = hashedCodes;
    await user.save({ validateModifiedOnly: true });

    res.json({ backupCodes: rawBackupCodes });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── Team Management ────────────────────────────────────────────

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

router.get("/me/signature", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("digitalSignature");
    res.json({ signature: user?.digitalSignature || "" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/me/signature", protect, async (req, res) => {
  try {
    const { signature } = req.body;
    await User.findByIdAndUpdate(req.user._id, { digitalSignature: signature || "" });
    res.json({ message: "Signature saved" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
