import twilio from "twilio";
import Call from "../models/Call.js";
import Patient from "../models/Patient.js";
import Organization from "../models/Organization.js";
import { getLanguageConfig } from "../config/languages.js";

const ACTIVE_AGENTS = new Map();
const INTERVAL = 60 * 1000;

const AGENT_SCRIPTS = {
  follow_up: {
    en: "Hi {patientName}, this is {practiceName} checking in on you. You spoke with our triage team earlier and we wanted to see how you are feeling. If you need further assistance, please call us back at {phoneNumber}. Thank you and take care.",
    fr: "Bonjour {patientName}, c'est {practiceName} qui prend de vos nouvelles. Vous avez parlé avec notre équipe de triage plus tôt et nous voulions savoir comment vous vous sentez. Si vous avez besoin d'aide supplémentaire, veuillez nous rappeler au {phoneNumber}. Merci et prenez soin de vous.",
    es: "Hola {patientName}, soy {practiceName} para saber cómo está. Habló con nuestro equipo de triaje antes y queríamos saber cómo se siente. Si necesita más ayuda, llámenos al {phoneNumber}. Gracias y cuídese.",
  },
  appointment_reminder: {
    en: "Hi {patientName}, this is a reminder from {practiceName} about your upcoming appointment. Please make sure to arrive on time. If you need to reschedule, call us at {phoneNumber}. Thank you.",
    fr: "Bonjour {patientName}, rappel de {practiceName} concernant votre prochain rendez-vous. Merci d'arriver à l'heure. Si vous devez reporter, appelez-nous au {phoneNumber}. Merci.",
    es: "Hola {patientName}, un recordatorio de {practiceName} sobre su próxima cita. Por favor llegue a tiempo. Si necesita reprogramar, llámenos al {phoneNumber}. Gracias.",
  },
  medication_reminder: {
    en: "Hi {patientName}, this is {practiceName} reminding you to take your medication as prescribed by your doctor. If you have any questions about your medications, please call us at {phoneNumber}. Take care.",
    fr: "Bonjour {patientName}, {practiceName} vous rappelle de prendre vos médicaments comme prescrit par votre médecin. Si vous avez des questions, appelez-nous au {phoneNumber}. Prenez soin de vous.",
    es: "Hola {patientName}, {practiceName} le recuerda tomar sus medicamentos según lo recetado. Si tiene preguntas, llámenos al {phoneNumber}. Cuídese.",
  },
  post_discharge: {
    en: "Hi {patientName}, this is {practiceName} following up after your recent visit. We hope you are recovering well. If you have any concerns or need assistance, please call us at {phoneNumber}. Thank you.",
    fr: "Bonjour {patientName}, {practiceName} assure le suivi après votre récente visite. Nous espérons que vous récupérez bien. Si vous avez des préoccupations, appelez-nous au {phoneNumber}. Merci.",
    es: "Hola {patientName}, {practiceName} hace seguimiento después de su visita reciente. Esperamos que se esté recuperando bien. Si tiene inquietudes, llámenos al {phoneNumber}. Gracias.",
  },
};

function fillScript(template, vars) {
  return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] || `[${key}]`);
}

export async function scheduleAutomatedCall({ patientId, type, scheduledAt, organizationId, notes } = {}) {
  const patient = await Patient.findById(patientId);
  if (!patient || !patient.phone || patient.doNotCall) {
    throw new Error("Patient not available for calls");
  }

  const lang = patient.language || "en";
  const org = organizationId ? await Organization.findById(organizationId) : null;
  const practiceName = org?.name || process.env.PRACTICE_NAME || "Your Healthcare Provider";
  const phoneNumber = process.env.TWILIO_PHONE_NUMBER || "the clinic";
  const scriptTemplates = AGENT_SCRIPTS[type];
  const scriptTemplate = scriptTemplates?.[lang] || scriptTemplates?.en || "";
  const message = fillScript(scriptTemplate, {
    patientName: patient.name,
    practiceName,
    phoneNumber,
  });

  const call = await Call.create({
    patient: patientId,
    organization: organizationId,
    type: "outbound",
    status: "scheduled",
    scheduledAt: scheduledAt || new Date(),
    patientLanguage: lang,
    notes: notes || `Automated ${type} call`,
    isAutomated: true,
    automatedType: type,
    automatedScript: message,
  });

  return call;
}

export async function executeAutomatedCall(callId) {
  const call = await Call.findById(callId).populate("patient");
  if (!call || !call.patient || !call.patient.phone) return null;

  const serverUrl = process.env.SERVER_URL || "http://localhost:5000";
  const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

  const twilioCall = await client.calls.create({
    to: call.patient.phone,
    from: process.env.TWILIO_PHONE_NUMBER,
    twiml: `<?xml version="1.0" encoding="UTF-8"?>
      <Response>
        <Say voice="alice" language="${call.patient.language === "fr" ? "fr-FR" : call.patient.language === "es" ? "es-ES" : "en-US"}">
          ${call.automatedScript || "This is an automated message from your healthcare provider."}
        </Say>
      </Response>`,
    statusCallback: `${serverUrl}/api/voice/twilio/status`,
    statusCallbackEvent: ["completed", "failed"],
  });

  call.twilioCallSid = twilioCall.sid;
  call.status = "in-progress";
  call.startedAt = new Date();
  await call.save();
  return twilioCall;
}

export function startAutomatedCallScheduler() {
  console.log("[PatientVoiceAgent] Starting automated call scheduler...");
  const timer = setInterval(async () => {
    try {
      const now = new Date();
      const due = await Call.find({
        status: "scheduled",
        isAutomated: true,
        scheduledAt: { $lte: now },
      }).populate("patient");

      for (const call of due) {
        if (call.patient?.doNotCall) {
          call.status = "cancelled";
          call.notes = (call.notes || "") + " — Patient opted out";
          await call.save();
          continue;
        }
        executeAutomatedCall(call._id.toString()).catch((err) => {
          console.error(`[PatientVoiceAgent] Failed to execute call ${call._id}:`, err.message);
        });
      }
    } catch (err) {
      console.error("[PatientVoiceAgent] Scheduler error:", err.message);
    }
  }, INTERVAL);

  ACTIVE_AGENTS.set("scheduler", timer);
  return timer;
}

export function stopAutomatedCallScheduler() {
  const timer = ACTIVE_AGENTS.get("scheduler");
  if (timer) {
    clearInterval(timer);
    ACTIVE_AGENTS.delete("scheduler");
  }
}
