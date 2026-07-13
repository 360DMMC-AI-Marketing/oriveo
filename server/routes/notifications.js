import { Router } from "express";
import { z } from "zod";
import { protect } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { notificationQuerySchema, markReadSchema, deleteNotificationSchema } from "../validators/notification.js";
import Notification from "../models/Notification.js";

const router = Router();

router.use(protect);

const idParam = z.object({ id: z.string().regex(/^[a-f\d]{24}$/i, "Invalid ID") });

router.get("/", validate(notificationQuerySchema, "query"), async (req, res) => {
  try {
    const { read, type, limit = 20, offset = 0 } = req.query;
    const query = { user: req.user._id };

    if (read === "true") query.read = true;
    else if (read === "false") query.read = false;
    if (type) query.type = type;

    const [notifications, total, unread] = await Promise.all([
      Notification.find(query)
        .populate("patient", "name phone")
        .populate("call", "status")
        .sort({ createdAt: -1 })
        .skip(parseInt(offset))
        .limit(parseInt(limit))
        .lean(),
      Notification.countDocuments(query),
      Notification.countDocuments({ user: req.user._id, read: false }),
    ]);

    res.json({ notifications, total, unread, limit: parseInt(limit), offset: parseInt(offset) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/unread-count", async (req, res) => {
  try {
    const count = await Notification.countDocuments({ user: req.user._id, read: false });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/read-all", async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user._id, read: false },
      { read: true, readAt: new Date() }
    );
    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/:id/read", validate(idParam, "params"), async (req, res) => {
  try {
    const notif = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { read: true, readAt: new Date() },
      { new: true }
    );
    if (!notif) return res.status(404).json({ message: "Notification not found" });
    res.json({ notification: notif });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete("/:id", validate(idParam, "params"), async (req, res) => {
  try {
    const notif = await Notification.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!notif) return res.status(404).json({ message: "Notification not found" });
    res.json({ message: "Notification deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
