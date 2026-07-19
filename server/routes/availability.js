import { Router } from "express";
import Availability from "../models/Availability.js";
import ProviderSchedule from "../models/ProviderSchedule.js";
import { protect, authorize } from "../middleware/auth.js";
import { getAvailableSlots, getProviderList } from "../utils/slotGenerator.js";

const router = Router();

router.use(protect);

router.get("/", async (req, res) => {
  try {
    const availability = await Availability.find({ organization: req.user.organization }).sort({ dayOfWeek: 1, startTime: 1 });
    res.json({ availability });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/", authorize("admin"), async (req, res) => {
  try {
    const { slots } = req.body;
    if (!slots || !Array.isArray(slots)) return res.status(400).json({ message: "slots array required" });

    await Availability.deleteMany({ organization: req.user.organization });

    const docs = slots.map((s) => ({
      organization: req.user.organization,
      dayOfWeek: s.dayOfWeek,
      startTime: s.startTime,
      endTime: s.endTime,
      slotDuration: s.slotDuration || 30,
      bufferBetween: s.bufferBetween || 0,
      isActive: s.isActive !== false,
      isDefault: true,
    }));

    const created = await Availability.insertMany(docs);
    res.json({ availability: created, message: "Org availability updated" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/providers", async (req, res) => {
  try {
    const providers = await getProviderList(req.user.organization);
    res.json({ providers });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/providers/:providerId", async (req, res) => {
  try {
    const schedule = await ProviderSchedule.find({
      provider: req.params.providerId,
      organization: req.user.organization,
    }).sort({ dayOfWeek: 1, startTime: 1 });
    res.json({ schedule });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/providers/:providerId", authorize("admin"), async (req, res) => {
  try {
    const { slots } = req.body;
    if (!slots || !Array.isArray(slots)) return res.status(400).json({ message: "slots array required" });

    const providerId = req.params.providerId;
    const orgId = req.user.organization;

    await ProviderSchedule.deleteMany({ provider: providerId, organization: orgId });

    const docs = slots.map((s) => ({
      provider: providerId,
      organization: orgId,
      dayOfWeek: s.dayOfWeek,
      startTime: s.startTime,
      endTime: s.endTime,
      slotDuration: s.slotDuration || null,
      bufferBetween: s.bufferBetween || null,
      isActive: s.isActive !== false,
    }));

    const created = await ProviderSchedule.insertMany(docs);
    res.json({ schedule: created, message: "Provider schedule updated" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete("/providers/:providerId", authorize("admin"), async (req, res) => {
  try {
    await ProviderSchedule.deleteMany({ provider: req.params.providerId, organization: req.user.organization });
    res.json({ message: "Provider schedule overrides removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Self-service: get own schedule
router.get("/me", async (req, res) => {
  try {
    const schedule = await ProviderSchedule.find({
      provider: req.user._id,
      organization: req.user.organization,
    }).sort({ dayOfWeek: 1, startTime: 1 });
    res.json({ schedule });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Self-service: update own schedule
router.put("/me", async (req, res) => {
  try {
    const { slots } = req.body;
    if (!slots || !Array.isArray(slots)) return res.status(400).json({ message: "slots array required" });

    const providerId = req.user._id;
    const orgId = req.user.organization;

    await ProviderSchedule.deleteMany({ provider: providerId, organization: orgId });

    const docs = slots.map((s) => ({
      provider: providerId,
      organization: orgId,
      dayOfWeek: s.dayOfWeek,
      startTime: s.startTime,
      endTime: s.endTime,
      slotDuration: s.slotDuration || null,
      bufferBetween: s.bufferBetween || null,
      isActive: s.isActive !== false,
    }));

    const created = await ProviderSchedule.insertMany(docs);
    res.json({ schedule: created, message: "Your schedule updated" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Self-service: reset own schedule to org defaults
router.delete("/me", async (req, res) => {
  try {
    await ProviderSchedule.deleteMany({ provider: req.user._id, organization: req.user.organization });
    res.json({ message: "Your schedule overrides removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/slots", async (req, res) => {
  try {
    const { date, provider } = req.query;
    if (!date) return res.status(400).json({ message: "date required" });

    const slots = await getAvailableSlots(req.user.organization, date, provider || null);
    res.json({ slots, date });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
