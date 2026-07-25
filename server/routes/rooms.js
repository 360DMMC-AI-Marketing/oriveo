import { Router } from "express";
import Room from "../models/Room.js";
import { protect, authorize } from "../middleware/auth.js";

const router = Router();
router.use(protect);

router.get("/", async (req, res) => {
  try {
    const { status, type, floor, search } = req.query;
    const filter = { organization: req.user.organization, isActive: true };
    if (status) filter.status = status;
    if (type) filter.type = type;
    if (floor) filter.floor = floor;
    if (search) filter.name = { $regex: search, $options: "i" };
    const rooms = await Room.find(filter).sort({ floor: 1, number: 1, name: 1 }).populate("currentPatient", "name phone").populate("currentProvider", "name").lean();
    const summary = await Room.aggregate([
      { $match: { organization: req.user.organization, isActive: true } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);
    const summaryMap = {};
    for (const s of summary) summaryMap[s._id] = s.count;
    res.json({ rooms, summary: { total: rooms.length, available: summaryMap.available || 0, occupied: summaryMap.occupied || 0, maintenance: summaryMap.maintenance || 0, reserved: summaryMap.reserved || 0, cleaning: summaryMap.cleaning || 0 } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/availability", async (req, res) => {
  try {
    const { date, time, duration, type } = req.query;
    const filter = { organization: req.user.organization, isActive: true, status: "available" };
    if (type) filter.type = type;
    const rooms = await Room.find(filter).sort({ number: 1, name: 1 }).lean();
    res.json({ rooms });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/stats", async (req, res) => {
  try {
    const orgId = req.user.organization;
    const [byType, byFloor, byStatus] = await Promise.all([
      Room.aggregate([
        { $match: { organization: orgId, isActive: true } },
        { $group: { _id: "$type", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Room.aggregate([
        { $match: { organization: orgId, isActive: true, floor: { $ne: "" } } },
        { $group: { _id: "$floor", count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Room.aggregate([
        { $match: { organization: orgId, isActive: true } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
    ]);
    res.json({ byType, byFloor, byStatus });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/", authorize("admin"), async (req, res) => {
  try {
    const room = await Room.create({ ...req.body, organization: req.user.organization });
    res.status(201).json(room);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put("/:id", authorize("admin"), async (req, res) => {
  try {
    const room = await Room.findOneAndUpdate(
      { _id: req.params.id, organization: req.user.organization },
      req.body,
      { new: true, runValidators: true }
    );
    if (!room) return res.status(404).json({ message: "Room not found" });
    res.json(room);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put("/:id/status", authorize("admin", "doctor", "nurse"), async (req, res) => {
  try {
    const { status, patientId, providerId, appointmentId, occupiedUntil } = req.body;
    const update = { status };
    if (status === "occupied") {
      update.currentPatient = patientId || null;
      update.currentProvider = providerId || null;
      update.currentAppointment = appointmentId || null;
      update.occupiedUntil = occupiedUntil || null;
    } else if (status === "available") {
      update.currentPatient = null;
      update.currentProvider = null;
      update.currentAppointment = null;
      update.occupiedUntil = null;
    } else if (status === "cleaning") {
      update.lastCleaned = new Date();
    } else if (status === "maintenance") {
      update.lastMaintenance = new Date();
    }
    const room = await Room.findOneAndUpdate(
      { _id: req.params.id, organization: req.user.organization },
      update,
      { new: true, runValidators: true }
    );
    if (!room) return res.status(404).json({ message: "Room not found" });
    const io = req.app.get("io");
    if (io) io.to(`org:${req.user.organization}`).emit("room:statusChanged", { roomId: room._id, status: room.status });
    res.json(room);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete("/:id", authorize("admin"), async (req, res) => {
  try {
    const room = await Room.findOneAndUpdate(
      { _id: req.params.id, organization: req.user.organization },
      { isActive: false },
      { new: true }
    );
    if (!room) return res.status(404).json({ message: "Room not found" });
    res.json({ message: "Room removed" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/seed", authorize("admin"), async (req, res) => {
  try {
    const { rooms } = req.body;
    if (!Array.isArray(rooms) || rooms.length === 0) {
      return res.status(400).json({ message: "Provide rooms array" });
    }
    const created = await Room.insertMany(
      rooms.map(r => ({ ...r, organization: req.user.organization }))
    );
    res.status(201).json({ count: created.length, rooms: created });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

export default router;
