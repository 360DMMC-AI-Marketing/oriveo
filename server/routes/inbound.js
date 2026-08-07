import { Router } from "express";
import Call from "../models/Call.js";
import Patient from "../models/Patient.js";
import Organization from "../models/Organization.js";
import { isWithinBusinessHours } from "../services/voiceAgent.js";
import crypto from "crypto";

const router = Router();

function validateTwilioSignature(req, res, next) {
  if (!process.env.TWILIO_AUTH_TOKEN) {
    console.warn("[Twilio] TWILIO_AUTH_TOKEN not configured — rejecting webhook (fail-closed)");
    return res.status(503).json({ error: "Twilio webhook rejected: auth token not configured" });
  }
  const twilioSignature = req.headers["x-twilio-signature"];
  if (!twilioSignature) {
    console.warn("[Twilio] Missing signature header — rejecting webhook");
    return res.status(403).json({ error: "Invalid Twilio signature" });
  }
  const url = `${process.env.SERVER_URL || `${req.protocol}://${req.headers.host}`}${req.originalUrl}`;
  const params = {};
  for (const [key, value] of Object.entries(req.body || {})) {
    if (typeof value === "string") params[key] = value;
  }
  const data = Object.keys(params).sort().reduce((acc, key) => {
    acc += key + params[key];
    return acc;
  }, url);
  const hmac = crypto.createHmac("sha1", process.env.TWILIO_AUTH_TOKEN);
  hmac.update(Buffer.from(data, "utf-8"));
  const expected = Buffer.from(hmac.digest("base64")).toString();
  if (twilioSignature !== expected) {
    console.warn("[Twilio] Invalid inbound webhook signature — rejecting");
    return res.status(403).json({ error: "Invalid Twilio signature" });
  }
  next();
}

function escapeRegex(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

router.post("/inbound", validateTwilioSignature, async (req, res) => {
  try {
    const { CallSid, From, To, CallStatus } = req.body;
    console.log(`[inbound] Incoming call from ${From} to ${To}, SID: ${CallSid}`);

    const callerPhone = From?.replace(/[^0-9+]/g, "") || "";
    let foundPatient = null;
    let orgId = null;

    if (callerPhone) {
      foundPatient = await Patient.findOne({ phone: { $regex: escapeRegex(callerPhone).slice(-10) + "$" } });
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

    const org = orgId ? await Organization.findById(orgId).select("name businessHours") : null;
    const practiceName = org?.name || "your healthcare provider";
    const bh = org?.businessHours;

    if (bh?.enabled && !isWithinBusinessHours(bh)) {
      console.log(`[inbound] After-hours — org ${orgId}`);
      if (bh.afterHoursAction === "transfer" && bh.transferNumber) {
        const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna-Neural">${escapeXml(`${practiceName} is currently closed. Transferring you to our on-call line now. Please hold.`)}</Say>
  <Dial>${escapeXml(bh.transferNumber)}</Dial>
  <Say voice="Polly.Joanna-Neural">Sorry, the transfer could not be completed. Please try again during business hours.</Say>
  <Hangup/>
</Response>`;
        res.type("text/xml").send(twiml);
        await Call.findByIdAndUpdate(call._id, { status: "transferred", completedAt: new Date() });
        return;
      }
      const closedMsg = bh.closedMessage || `${practiceName} is currently closed. Our business hours are listed on our website. Please leave a message with your name, phone number, and reason for calling, and we will call you back on the next business day.`;
      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna-Neural">${escapeXml(closedMsg)}</Say>
  <Record maxLength="120" action="${process.env.SERVER_URL || `http://${req.hostname}:${process.env.PORT || 5000}`}/api/inbound/after-hours-recording?callId=${call._id}" transcribe="true" transcribeCallback="${process.env.SERVER_URL || `http://${req.hostname}:${process.env.PORT || 5000}`}/api/inbound/after-hours-transcription?callId=${call._id}"/>
  <Say voice="Polly.Joanna-Neural">Thank you for your message. We will call you back on the next business day. Goodbye.</Say>
  <Hangup/>
</Response>`;
      res.type("text/xml").send(twiml);
      return;
    }

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

router.post("/after-hours-recording", validateTwilioSignature, async (req, res) => {
  try {
    const { callId } = req.query;
    const { RecordingUrl, RecordingSid, RecordingDuration } = req.body;
    if (callId) {
      await Call.findByIdAndUpdate(callId, {
        recordingUrl: RecordingUrl || "",
        twilioRecordingSid: RecordingSid || "",
        recordingDuration: RecordingDuration ? parseInt(RecordingDuration) : undefined,
        status: "completed",
        completedAt: new Date(),
        outcome: "after-hours-message",
        notes: "After-hours voicemail recorded",
      });
      console.log(`[inbound] After-hours recording saved for call ${callId}: ${RecordingSid}`);
    }
    res.type("text/xml").send(`<?xml version="1.0" encoding="UTF-8"?><Response></Response>`);
  } catch (err) {
    console.error("[inbound] after-hours-recording error:", err.message);
    res.type("text/xml").send(`<?xml version="1.0" encoding="UTF-8"?><Response></Response>`);
  }
});

router.post("/after-hours-transcription", validateTwilioSignature, async (req, res) => {
  try {
    const { callId } = req.query;
    const { TranscriptionText, TranscriptionStatus } = req.body;
    if (callId && TranscriptionStatus === "completed" && TranscriptionText) {
      await Call.findByIdAndUpdate(callId, {
        transcript: [{ role: "caller", text: TranscriptionText, timestamp: new Date() }],
        aiSummary: `After-hours voicemail: ${TranscriptionText}`,
      });
      console.log(`[inbound] After-hours transcription saved for call ${callId}`);
    }
    res.sendStatus(200);
  } catch (err) {
    console.error("[inbound] after-hours-transcription error:", err.message);
    res.sendStatus(200);
  }
});

export default router;
