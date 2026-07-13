import { Router } from "express";
import { protect, authorize } from "../middleware/auth.js";

const router = Router();

const verifiedNumbers = [];
const brandedCallProfiles = [];

router.use(protect);

router.get("/numbers", (req, res) => {
  const twilioNumber = process.env.TWILIO_PHONE_NUMBER || "";
  res.json({
    numbers: [
      {
        phoneNumber: twilioNumber,
        friendlyName: "Main Line",
        verified: twilioNumber ? true : false,
        provider: "Twilio",
        capabilities: { voice: true, sms: true },
      },
      ...verifiedNumbers.filter((n) => n.createdBy === req.user._id || req.user.role === "admin"),
    ],
  });
});

router.post("/numbers/verify", authorize("admin"), async (req, res) => {
  try {
    const { phoneNumber, friendlyName } = req.body;
    if (!phoneNumber) {
      return res.status(400).json({ message: "Phone number required" });
    }

    verifiedNumbers.push({
      id: `vn-${Date.now()}`,
      phoneNumber,
      friendlyName: friendlyName || phoneNumber,
      verified: true,
      verifiedAt: new Date().toISOString(),
      provider: "Manual",
      capabilities: { voice: true, sms: false },
      createdBy: req.user._id,
    });

    res.json({
      success: true,
      number: verifiedNumbers[verifiedNumbers.length - 1],
      message: "Phone number verified successfully",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete("/numbers/:id", authorize("admin"), (req, res) => {
  const index = verifiedNumbers.findIndex((n) => n.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: "Number not found" });
  verifiedNumbers.splice(index, 1);
  res.json({ message: "Number removed" });
});

router.get("/branded-call", (req, res) => {
  res.json({
    profiles: brandedCallProfiles.filter(
      (p) => p.createdBy === req.user._id || req.user.role === "admin"
    ),
    enabled: process.env.BRANDED_CALL_ID_ENABLED === "true",
  });
});

router.post("/branded-call", authorize("admin"), async (req, res) => {
  try {
    const { displayName, logoUrl, callReason } = req.body;
    if (!displayName) {
      return res.status(400).json({ message: "Display name required" });
    }

    const profile = {
      id: `bc-${Date.now()}`,
      displayName,
      logoUrl: logoUrl || "",
      callReason: callReason || "Appointment Reminder",
      status: "active",
      createdAt: new Date().toISOString(),
      createdBy: req.user._id,
    };

    brandedCallProfiles.push(profile);

    res.status(201).json({
      success: true,
      profile,
      message: `Branded Call ID profile "${displayName}" created`,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/branded-call/:id", authorize("admin"), (req, res) => {
  const profile = brandedCallProfiles.find((p) => p.id === req.params.id);
  if (!profile) return res.status(404).json({ message: "Profile not found" });

  const { displayName, logoUrl, callReason } = req.body;
  if (displayName) profile.displayName = displayName;
  if (logoUrl !== undefined) profile.logoUrl = logoUrl;
  if (callReason) profile.callReason = callReason;

  res.json({ success: true, profile });
});

router.delete("/branded-call/:id", authorize("admin"), (req, res) => {
  const index = brandedCallProfiles.findIndex((p) => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: "Profile not found" });
  brandedCallProfiles.splice(index, 1);
  res.json({ message: "Profile removed" });
});

export default router;
