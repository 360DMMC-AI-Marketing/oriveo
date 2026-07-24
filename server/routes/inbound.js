import { Router } from "express";
import Call from "../models/Call.js";
import Patient from "../models/Patient.js";
import Organization from "../models/Organization.js";

const router = Router();

router.post("/inbound", async (req, res) => {
  try {
    const { CallSid, From, To, CallStatus } = req.body;
    console.log(`[inbound] Incoming call from ${From} to ${To}, SID: ${CallSid}`);

    const callerPhone = From?.replace(/[^0-9+]/g, "") || "";
    let foundPatient = null;
    let orgId = null;

    if (callerPhone) {
      foundPatient = await Patient.findOne({ phone: { $regex: callerPhone.replace("+", "\\+").slice(-10) + "$" } });
      if (foundPatient) {
        orgId = foundPatient.organization;
        console.log(`[inbound] Found patient by phone: ${foundPatient.name} (org: ${orgId})`);
      }
    }

    const call = await Call.create({
      direction: "inbound",
      status: "in-progress",
      startedAt: new Date(),
      twilioCallSid: CallSid,
      organization: orgId,
      patient: foundPatient?._id || null,
      language: foundPatient?.language || "en",
    });

    const org = orgId ? await Organization.findById(orgId).select("name") : null;
    const practiceName = org?.name || "your healthcare provider";
    const greeting = foundPatient
      ? `Hello ${foundPatient.name}. This is an automated health checkup from ${practiceName}. Please hold while we begin.`
      : `Welcome to ${practiceName}. Please hold while our virtual assistant connects with you.`;

    const serverUrl = process.env.SERVER_URL || `http://${req.hostname}:${process.env.PORT || 5000}`;
    const wsUrl = (process.env.WSS_URL || serverUrl.replace(/^http/, "ws")).replace(/\/+$/, "");

    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna-Neural">${escapeXml(greeting)}</Say>
  <Connect>
    <Stream url="${wsUrl}/inbound-media-stream/${call._id}">
      <Parameter name="callId" value="${call._id}"/>
    </Stream>
  </Connect>
</Response>`;

    res.type("text/xml").send(twiml);
  } catch (error) {
    console.error("[inbound] Error:", error.message);
    const fallback = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna-Neural">We are experiencing a technical issue. Please try again later.</Say>
</Response>`;
    res.type("text/xml").send(fallback);
  }
});

function escapeXml(str) {
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

export default router;
