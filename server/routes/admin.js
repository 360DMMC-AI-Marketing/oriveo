import { Router } from "express";
import mongoose from "mongoose";
import { protect } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { createOrgSchema, updateOrgSchema, addOrgUserSchema, subscriptionSchema, settingsSchema } from "../validators/admin.js";
import Organization from "../models/Organization.js";
import Subscription from "../models/Subscription.js";
import User from "../models/User.js";
import Patient from "../models/Patient.js";
import Call from "../models/Call.js";
import CallEvent from "../models/CallEvent.js";
import ServerConfig from "../models/ServerConfig.js";

const router = Router();

// ─── Health Monitoring (public) ──────────────────────────

async function checkService(name, checkFn) {
  try {
    const result = await checkFn();
    if (result === null) return { name, status: "disabled", message: "Not configured" };
    return { name, status: "ok", message: result };
  } catch (e) {
    return { name, status: "error", message: e.message };
  }
}

router.get("/health", async (req, res) => {
  try {
    const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000);
    const mongodbState = ["disconnected", "connected", "connecting", "disconnecting"][mongoose.connection.readyState] || "unknown";

    const services = await Promise.all([
      checkService("MongoDB", async () => mongoose.connection.readyState === 1 ? "Connected" : null),
      checkService("OpenAI", async () => {
        if (!process.env.OPENAI_API_KEY) return null;
        const resp = await fetch("https://api.openai.com/v1/models", {
          headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
          signal: AbortSignal.timeout(5000),
        });
        return resp.ok ? "API reachable" : null;
      }),
      checkService("Deepgram", async () => {
        return process.env.DEEPGRAM_API_KEY ? "API key set" : null;
      }),
      checkService("ElevenLabs", async () => {
        return process.env.ELEVENLABS_API_KEY ? "API key set" : null;
      }),
      checkService("Twilio", async () => {
        return process.env.TWILIO_ACCOUNT_SID ? "Account SID set" : null;
      }),
      checkService("athenahealth EHR", async () => {
        const { isAthenaConfigured } = await import("../services/ehrAthena.js");
        return isAthenaConfigured() ? "Configured" : null;
      }),
      checkService("ACS Email", async () => {
        return process.env.ACS_CONNECTION_STRING ? "Connection string set" : null;
      }),
      checkService("Sentry", async () => {
        return process.env.SENTRY_DSN ? "DSN set" : null;
      }),
      checkService("PHI Encryption", async () => {
        return process.env.PHI_ENCRYPTION_KEY ? "Key configured" : null;
      }),
    ]);

    const failedCalls30m = await Call.countDocuments({
      status: "failed",
      createdAt: { $gte: thirtyMinAgo },
    });
    const totalCalls30m = await Call.countDocuments({
      createdAt: { $gte: thirtyMinAgo },
    });
    const errorEvents30m = await CallEvent.countDocuments({
      type: "error",
      timestamp: { $gte: thirtyMinAgo },
    });
    const errorRate = totalCalls30m > 0 ? (failedCalls30m / totalCalls30m * 100).toFixed(2) : "0.00";
    const orgStatuses = await Subscription.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);
    const configuredServices = services.filter(s => s.status !== "disabled");
    const allOk = configuredServices.every(s => s.status === "ok") && failedCalls30m < 5 && parseFloat(errorRate) < 20;

    res.json({
      services,
      periodMinutes: 30,
      failedCalls: failedCalls30m,
      totalCalls: totalCalls30m,
      errorRate: `${errorRate}%`,
      errorEvents: errorEvents30m,
      orgStatuses: Object.fromEntries(orgStatuses.map(o => [o._id, o.count])),
      healthy: allOk,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.use(protect);

function requireSuperAdmin(req, res, next) {
  if (!req.user.superAdmin) return res.status(403).json({ message: "Super admin access required" });
  next();
}

// ─── Organizations ──────────────────────────────────────

router.get("/organizations", requireSuperAdmin, async (req, res) => {
  try {
    const orgs = await Organization.find().sort({ createdAt: -1 }).lean();
    const subs = await Subscription.find({ organization: { $in: orgs.map(o => o._id) } }).lean();
    const subMap = {};
    for (const s of subs) subMap[s.organization.toString()] = s;
    const enriched = await Promise.all(orgs.map(async (org) => {
      const userCount = await User.countDocuments({ organization: org._id });
      const patientCount = await Patient.countDocuments({ organization: org._id });
      const callCount = await Call.countDocuments({ organization: org._id });
      return {
        ...org,
        subscription: subMap[org._id.toString()] || null,
        stats: { users: userCount, patients: patientCount, calls: callCount },
      };
    }));
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/organizations", requireSuperAdmin, validate(createOrgSchema), async (req, res) => {
  try {
    const { name, slug } = req.body;
    const org = await Organization.create({ name, slug, settings: req.body.settings || {} });
    await Subscription.create({
      organization: org._id,
      plan: req.body.plan || "starter",
      status: "active",
      limits: req.body.limits || {},
    });
    res.status(201).json(org);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/organizations/:id/users", requireSuperAdmin, async (req, res) => {
  try {
    const users = await User.find({ organization: req.params.id }).select("name email role isActive createdAt").sort({ createdAt: -1 }).lean();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/organizations/:id/users", requireSuperAdmin, validate(addOrgUserSchema), async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: "User already exists" });
    const user = await User.create({ name, email, password, role: role || "admin", organization: req.params.id });
    res.status(201).json({ user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete("/organizations/:orgId/users/:userId", requireSuperAdmin, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.params.userId, { organization: null, isActive: false });
    res.json({ message: "User removed from organization" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put("/organizations/:id", requireSuperAdmin, validate(updateOrgSchema), async (req, res) => {
  try {
    const { name, settings, isActive } = req.body;
    const update = {};
    if (name !== undefined) update.name = name;
    if (settings !== undefined) update.settings = settings;
    if (isActive !== undefined) update.isActive = isActive;
    const org = await Organization.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!org) return res.status(404).json({ message: "Organization not found" });
    res.json(org);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete("/organizations/:id", requireSuperAdmin, async (req, res) => {
  try {
    await Organization.findByIdAndDelete(req.params.id);
    await Subscription.deleteOne({ organization: req.params.id });
    await User.updateMany({ organization: req.params.id }, { isActive: false, organization: null });
    res.json({ message: "Organization deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── Subscriptions ──────────────────────────────────────

router.get("/subscriptions", requireSuperAdmin, async (req, res) => {
  try {
    const subs = await Subscription.find().populate("organization", "name slug").sort({ createdAt: -1 }).lean();
    res.json(subs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put("/subscriptions/:orgId", requireSuperAdmin, validate(subscriptionSchema), async (req, res) => {
  try {
    const { plan, status, endDate, limits } = req.body;
    const update = {};
    if (plan !== undefined) update.plan = plan;
    if (status !== undefined) update.status = status;
    if (endDate !== undefined) update.endDate = endDate;
    if (limits !== undefined) update.limits = limits;
    const sub = await Subscription.findOneAndUpdate(
      { organization: req.params.orgId },
      update,
      { new: true, upsert: true }
    );
    if (status === "suspended") {
      await User.updateMany({ organization: req.params.orgId }, { isActive: false });
    } else if (status === "active") {
      await User.updateMany({ organization: req.params.orgId }, { isActive: true });
    }
    res.json(sub);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── Analytics (Company-wide) ────────────────────────────

router.get("/analytics/overview", requireSuperAdmin, async (req, res) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const [totalOrgs, totalUsers, totalPatients, callsTotal, callsLast30, activeSubs, recentEvents] = await Promise.all([
      Organization.countDocuments(),
      User.countDocuments({ superAdmin: false }),
      Patient.countDocuments(),
      Call.countDocuments(),
      Call.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      Subscription.countDocuments({ status: "active" }),
      CallEvent.countDocuments({ timestamp: { $gte: thirtyDaysAgo } }),
    ]);
    const callsByStatus = await Call.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);
    const callsByOrg = await Call.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      { $group: { _id: "$organization", count: { $sum: 1 } } },
    ]);
    res.json({
      totalOrganizations: totalOrgs,
      totalUsers,
      totalPatients,
      totalCalls: callsTotal,
      callsLast30Days: callsLast30,
      activeSubscriptions: activeSubs,
      eventsLast30Days: recentEvents,
      callsByStatus: Object.fromEntries(callsByStatus.map(c => [c._id, c.count])),
      callsByOrg,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/analytics/organization/:id", requireSuperAdmin, async (req, res) => {
  try {
    const orgId = req.params.id;
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const [users, patients, calls, callsLast30, sub] = await Promise.all([
      User.countDocuments({ organization: orgId }),
      Patient.countDocuments({ organization: orgId }),
      Call.countDocuments({ organization: orgId }),
      Call.countDocuments({ organization: orgId, createdAt: { $gte: thirtyDaysAgo } }),
      Subscription.findOne({ organization: orgId }),
    ]);
    const callsByStatus = await Call.aggregate([
      { $match: { organization: orgId, createdAt: { $gte: thirtyDaysAgo } } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);
    res.json({
      organization: orgId,
      users,
      patients,
      totalCalls: calls,
      callsLast30Days: callsLast30,
      subscription: sub,
      callsByStatus: Object.fromEntries(callsByStatus.map(c => [c._id, c.count])),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── Server Configuration (super admin only) ────────────

const DEFAULT_CONFIG_KEYS = [
  { key: "TWILIO_ACCOUNT_SID",       label: "Twilio Account SID",       masked: true },
  { key: "TWILIO_AUTH_TOKEN",        label: "Twilio Auth Token",        masked: true },
  { key: "TWILIO_PHONE_NUMBER",      label: "Twilio Phone Number",      masked: false },
  { key: "CLINIC_EMERGENCY_NUMBER",  label: "Clinic Emergency Number",  masked: false },
  { key: "HUMAN_TRANSFER_NUMBER",    label: "Human Transfer Number",    masked: false },
  { key: "PRACTICE_NAME",            label: "Practice Name",            masked: false },
  { key: "ON_CALL_PHONE",            label: "On-Call Phone",            masked: false },
];

router.get("/settings", requireSuperAdmin, async (req, res) => {
  try {
    const existing = await ServerConfig.find({}).lean();
    const existingMap = new Map(existing.map((c) => [c.key, c]));

    const configs = DEFAULT_CONFIG_KEYS.map((def) => {
      const found = existingMap.get(def.key);
      return {
        key: def.key,
        label: def.label,
        masked: def.masked,
        value: found ? found.value : "",
        _id: found ? found._id : null,
      };
    });

    res.json({ configs });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put("/settings", requireSuperAdmin, validate(settingsSchema), async (req, res) => {
  try {
    const { configs } = req.body;

    for (const c of configs) {
      const def = DEFAULT_CONFIG_KEYS.find((d) => d.key === c.key);
      if (!def) continue;

      await ServerConfig.findOneAndUpdate(
        { key: c.key },
        { value: c.value || "", label: def.label, masked: def.masked },
        { upsert: true, new: true }
      );

      // Also update process.env at runtime for the current server instance
      if (c.value) {
        process.env[c.key] = c.value;
      }
    }

    const updated = await ServerConfig.find({}).lean();
    res.json({ message: "Settings saved", configs: updated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/settings/environment", requireSuperAdmin, async (req, res) => {
  const keys = DEFAULT_CONFIG_KEYS.map((d) => d.key);
  const env = {};
  for (const k of keys) {
    env[k] = process.env[k] || "";
  }
  res.json({ env });
});

// ─── Tenant-scoped data for the current user's org ──────

router.get("/my/organization", async (req, res) => {
  if (req.user.superAdmin) return res.json({ superAdmin: true });
  try {
    const org = await Organization.findById(req.user.organization).lean();
    const sub = await Subscription.findOne({ organization: req.user.organization }).lean();
    res.json({ organization: org, subscription: sub });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
