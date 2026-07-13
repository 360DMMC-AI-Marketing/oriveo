import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Organization from "../models/Organization.js";
import Subscription from "../models/Subscription.js";

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, tokenVersion: user.tokenVersion },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
};

import { PROFESSIONS } from "../config/professions.js";

export const signup = async (req, res) => {
  try {
    const { name, email, password, role, phone, profession, specialty, clinicName, clinicSlug } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }
    const prof = profession ? PROFESSIONS.find(p => p.id === profession) : null;
    let organization = null;
    if (clinicName && clinicSlug) {
      const existingOrg = await Organization.findOne({ slug: clinicSlug });
      if (existingOrg) {
        return res.status(400).json({ message: "A clinic with this slug already exists" });
      }
      organization = await Organization.create({
        name: clinicName,
        slug: clinicSlug,
        type: prof?.orgType || "human",
      });
      await Subscription.create({
        organization: organization._id,
        plan: "starter",
        status: "active",
        limits: { maxUsers: 5, maxPatients: 500, maxMonthlyCalls: 1000 },
      });
    }
    const user = await User.create({
      name, email, password, role: role || "admin",
      profession: profession || "",
      phone,
      specialty: Array.isArray(specialty) ? specialty : (specialty ? [specialty] : []),
      organization: organization?._id || null,
    });
    await user.populate("organization", "name slug type");
    const token = generateToken(user);
    res.status(201).json({ token, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).populate("organization", "name slug type");
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    if (!user.isActive) {
      return res.status(403).json({ message: "Account is deactivated" });
    }
    const token = generateToken(user);
    res.json({ token, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMe = async (req, res) => {
  const user = await User.findById(req.user._id).populate("organization", "name slug type");
  res.json({ user });
};

export const updateProfile = async (req, res) => {
  try {
    const { name, phone, specialty, language } = req.body;
    let user = await User.findByIdAndUpdate(
      req.user._id,
      { name, phone, specialty, language },
      { new: true, runValidators: true }
    );
    user = await User.populate(user, { path: "organization", select: "name slug" });
    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current password and new password required" });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters" });
    }
    const user = await User.findById(req.user._id);
    if (!(await user.comparePassword(currentPassword))) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }
    user.password = newPassword;
    user.tokenVersion += 1;
    await user.save();
    await user.populate("organization", "name slug");
    const token = generateToken(user);
    res.json({ message: "Password changed successfully", token, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const revokeAllSessions = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { $inc: { tokenVersion: 1 } });
    res.json({ message: "All sessions revoked. Please login again." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
