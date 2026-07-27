import { Router } from "express";
import Organization from "../models/Organization.js";
import Call from "../models/Call.js";
import Patient from "../models/Patient.js";
import Subscription from "../models/Subscription.js";

const router = Router();

router.get("/stats", async (req, res) => {
  try {
    const [totalOrgs, totalCalls, totalPatients, activeOrgs] = await Promise.all([
      Organization.countDocuments(),
      Call.countDocuments(),
      Patient.countDocuments(),
      Subscription.countDocuments({ status: "active" }),
    ]);

    res.json({
      totalOrgs,
      totalCalls,
      totalPatients,
      activeOrgs,
      languages: 10,
      specialties: 28,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
