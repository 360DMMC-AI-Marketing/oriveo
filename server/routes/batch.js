import { Router } from "express";
import Call from "../models/Call.js";
import Patient from "../models/Patient.js";
import { protect, authorize } from "../middleware/auth.js";
import confirmAppointments from "../utils/confirmAppointments.js";

const router = Router();

const campaigns = [];

router.use(protect);

router.post("/start", authorize("admin", "doctor"), async (req, res) => {
  try {
    const { name, patientIds, scheduledAt, questionnaireId, customQuestions } = req.body;
    if (!name || !patientIds || !Array.isArray(patientIds)) {
      return res.status(400).json({ message: "Name and patientIds array required" });
    }

    const campaign = {
      id: `camp-${Date.now()}`,
      name,
      status: scheduledAt ? "scheduled" : "running",
      totalPatients: patientIds.length,
      completedCalls: 0,
      successfulCalls: 0,
      failedCalls: 0,
      scheduledAt: scheduledAt || null,
      createdAt: new Date().toISOString(),
      createdBy: req.user._id,
      patientIds,
      callIds: [],
      questionnaireId: questionnaireId || null,
      customQuestions: customQuestions || [],
    };

    campaigns.push(campaign);

    if (!scheduledAt) {
      processCampaign(campaign, req);
    }

    res.status(201).json({ campaign });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/campaigns", (req, res) => {
  const userCampaigns = campaigns
    .filter((c) => c.createdBy === req.user._id || req.user.role === "admin")
    .map((c) => ({
      id: c.id,
      name: c.name,
      status: c.status,
      totalPatients: c.totalPatients,
      completedCalls: c.completedCalls,
      successfulCalls: c.successfulCalls,
      failedCalls: c.failedCalls,
      scheduledAt: c.scheduledAt,
      createdAt: c.createdAt,
    }));
  res.json({ campaigns: userCampaigns });
});

router.get("/campaigns/:id", (req, res) => {
  const campaign = campaigns.find((c) => c.id === req.params.id);
  if (!campaign) {
    return res.status(404).json({ message: "Campaign not found" });
  }
  res.json({ campaign });
});

router.post("/campaigns/:id/pause", (req, res) => {
  const campaign = campaigns.find((c) => c.id === req.params.id);
  if (!campaign) return res.status(404).json({ message: "Campaign not found" });
  if (campaign.status !== "running") return res.status(400).json({ message: "Campaign is not running" });
  campaign.status = "paused";
  res.json({ campaign });
});

router.post("/campaigns/:id/resume", (req, res) => {
  const campaign = campaigns.find((c) => c.id === req.params.id);
  if (!campaign) return res.status(404).json({ message: "Campaign not found" });
  if (campaign.status !== "paused") return res.status(400).json({ message: "Campaign is not paused" });
  campaign.status = "running";
  processCampaign(campaign, req);
  res.json({ campaign });
});

async function processCampaign(campaign, req) {
  if (campaign.status !== "running") return;

  const serverUrl = process.env.SERVER_URL || `http://localhost:${process.env.PORT || 5000}`;

  for (const patientId of campaign.patientIds) {
    if (campaign.status !== "running") break;

    try {
      const patient = await Patient.findById(patientId);
      if (!patient || !patient.phone) {
        campaign.failedCalls++;
        campaign.completedCalls++;
        continue;
      }

      const call = await Call.create({
        patient: patient._id,
        questionnaire: campaign.questionnaireId || null,
        customQuestions: campaign.customQuestions || [],
        startedBy: campaign.createdBy,
        status: "scheduled",
        scheduledAt: new Date(),
        language: patient.language || "en",
      });
      campaign.callIds.push(call._id);
      confirmAppointments(patient._id, call._id);

      if (process.env.TWILIO_ACCOUNT_SID) {
        const twilio = (await import("twilio")).default;
        const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        try {
          const twilioCall = await client.calls.create({
            to: patient.phone,
            from: process.env.TWILIO_PHONE_NUMBER,
            url: `${serverUrl}/api/voice/twilio/outbound-twiml/${call._id}`,
            statusCallback: `${serverUrl}/api/voice/twilio/status`,
            statusCallbackEvent: ["completed", "failed", "busy", "no-answer"],
          });
          call.twilioCallSid = twilioCall.sid;
          call.status = "in-progress";
          call.startedAt = new Date();
          await call.save();
          campaign.successfulCalls++;
        } catch {
          call.status = "failed";
          await call.save();
          campaign.failedCalls++;
        }
      } else {
        campaign.successfulCalls++;
      }

      campaign.completedCalls++;
      await sleep(1000);
    } catch {
      campaign.failedCalls++;
      campaign.completedCalls++;
    }
  }

  if (campaign.completedCalls >= campaign.totalPatients) {
    campaign.status = "completed";
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default router;
