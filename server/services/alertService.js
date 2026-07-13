const ALERT_CONFIG = {
  twilioFrom: process.env.TWILIO_PHONE_NUMBER || "",
  slackWebhook: process.env.SLACK_WEBHOOK_URL || "",
  onCallPhone: process.env.ON_CALL_PHONE || "",
  enabled: true,
};

const alertLog = [];

export function configureAlerts(config) {
  Object.assign(ALERT_CONFIG, config);
}

export function getAlertLog() {
  return alertLog;
}

function formatEmotionData(emotionData) {
  if (!emotionData) return "";
  const parts = [];
  if (emotionData.primary && emotionData.primary !== "neutral") {
    parts.push(`State: ${emotionData.primary} (intensity: ${emotionData.intensity || 0})`);
  }
  if (emotionData.painLevel) {
    parts.push(`Pain: ${emotionData.painLevel}`);
  }
  return parts.length > 0 ? `\nEmotion: ${parts.join(" | ")}` : "";
}

export async function sendEmergencyAlert(callId, patientData, flags, emotionData) {
  const entry = { callId, type: "emergency", timestamp: new Date(), patientData, flags };
  alertLog.push(entry);

  const emotionStr = formatEmotionData(emotionData);
  const message = `🚨 EMERGENCY ALERT — Tier 0\nPatient: ${patientData?.name || "Unknown"}\nPhone: ${patientData?.phone || "N/A"}\nRed flags: ${(flags || []).map((f) => f.keyword).join(", ")}${emotionStr}\nCall ID: ${callId}\nAction: 911 script played — patient directed to call 911`;

  if (ALERT_CONFIG.slackWebhook) {
    await sendSlack(message);
  }
  if (ALERT_CONFIG.onCallPhone && ALERT_CONFIG.twilioFrom) {
    await sendSms(ALERT_CONFIG.onCallPhone, message);
  }

  return entry;
}

export async function sendUrgentAlert(callId, patientData, flags, emotionData) {
  const entry = { callId, type: "urgent", timestamp: new Date(), patientData, flags };
  alertLog.push(entry);

  const emotionStr = formatEmotionData(emotionData);
  const message = `⚠️ URGENT — Tier 1\nPatient: ${patientData?.name || "Unknown"}\nPhone: ${patientData?.phone || "N/A"}\nConcerns: ${(flags || []).map((f) => f.keyword).join(", ")}${emotionStr}\nCall ID: ${callId}\nAction: EHR task needed within 4 hours`;

  if (ALERT_CONFIG.slackWebhook) {
    await sendSlack(message);
  }

  return entry;
}

export async function sendAlert(callId, alertData) {
  const entry = { callId, type: alertData.type || "info", timestamp: new Date(), data: alertData };
  alertLog.push(entry);

  if (ALERT_CONFIG.slackWebhook) {
    const message = `[${alertData.type.toUpperCase()}] Call ${callId}\n${JSON.stringify(alertData, null, 2)}`;
    await sendSlack(message);
  }

  return entry;
}

async function sendSlack(message) {
  try {
    await fetch(ALERT_CONFIG.slackWebhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: message }),
    });
  } catch (error) {
    console.error("Slack alert failed:", error.message);
  }
}

export async function sendSms(to, message) {
  if (!ALERT_CONFIG.twilioFrom) return;
  try {
    const twilio = (await import("twilio")).default;
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    await client.messages.create({ to, from: ALERT_CONFIG.twilioFrom, body: message });
  } catch (error) {
    console.error("SMS alert failed:", error.message);
  }
}

export function isAlertingEnabled() {
  return ALERT_CONFIG.enabled;
}
