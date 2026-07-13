import Call from "../models/Call.js";
import Patient from "../models/Patient.js";

const RETRY_CONFIG = {
  maxAttempts: 3,
  retryDelaysMinutes: [30, 120, 360],
  quietHoursStart: 20,
  quietHoursEnd: 8,
};

const activeTimers = new Map();

export function scheduleRetry(callId, attemptNumber = 1) {
  if (attemptNumber > RETRY_CONFIG.maxAttempts) {
    console.log(`[${callId}] Max retry attempts reached (${RETRY_CONFIG.maxAttempts})`);
    return null;
  }

  const delayMinutes = RETRY_CONFIG.retryDelaysMinutes[attemptNumber - 1] || 360;
  const delayMs = delayMinutes * 60 * 1000;

  const timer = setTimeout(async () => {
    try {
      const call = await Call.findById(callId).populate("patient");
      if (!call || !call.patient) return;

      if (call.patient.doNotCall) {
        console.log(`[${callId}] Skipping retry — patient opted out`);
        return;
      }

      const now = new Date();
      const hour = now.getHours();
      const isQuietHours = hour >= RETRY_CONFIG.quietHoursStart || hour < RETRY_CONFIG.quietHoursEnd;

      if (isQuietHours) {
        const morning = new Date(now);
        morning.setHours(RETRY_CONFIG.quietHoursEnd, 0, 0, 0);
        if (morning <= now) morning.setDate(morning.getDate() + 1);
        const msUntilMorning = morning.getTime() - now.getTime();
        setTimeout(() => executeRetry(callId, attemptNumber), msUntilMorning);
        return;
      }

      await executeRetry(callId, attemptNumber);
    } catch (error) {
      console.error(`[${callId}] Retry error:`, error.message);
    }
  }, delayMs);

  activeTimers.set(callId, timer);
  return timer;
}

async function executeRetry(callId, attemptNumber) {
  try {
    const call = await Call.findById(callId).populate("patient");
    if (!call || !call.patient || !call.patient.phone) return;

    const twilio = (await import("twilio")).default;
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    const serverUrl = process.env.SERVER_URL || "http://localhost:5000";

    const newCall = await client.calls.create({
      to: call.patient.phone,
      from: process.env.TWILIO_PHONE_NUMBER,
      url: `${serverUrl}/api/voice/twilio/outbound-twiml/${callId}`,
      statusCallback: `${serverUrl}/api/voice/twilio/status`,
      statusCallbackEvent: ["completed", "failed", "busy", "no-answer"],
      machineDetection: "DetectMessageEnd",
      machineDetectionTimeout: 8,
      asyncAmd: "true",
      asyncAmdStatusCallback: `${serverUrl}/api/voice/amd-status/${callId}`,
    });

    call.twilioCallSid = newCall.sid;
    call.status = "in-progress";
    call.startedAt = new Date();
    call.recallCount = (call.recallCount || 0) + 1;
    await call.save();

    activeTimers.delete(callId);
    console.log(`[${callId}] Retry attempt ${attemptNumber} — CallSid: ${newCall.sid}`);
  } catch (error) {
    console.error(`[${callId}] Retry execution error:`, error.message);
  }
}

export function cancelRetry(callId) {
  const timer = activeTimers.get(callId);
  if (timer) {
    clearTimeout(timer);
    activeTimers.delete(callId);
  }
}

export function getRetryConfig() {
  return RETRY_CONFIG;
}

export function updateRetryConfig(config) {
  Object.assign(RETRY_CONFIG, config);
}
