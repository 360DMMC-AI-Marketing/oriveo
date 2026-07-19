import { Router } from "express";
import twilio from "twilio";
import Call from "../models/Call.js";
import Patient from "../models/Patient.js";
import Appointment from "../models/Appointment.js";
import Questionnaire from "../models/Questionnaire.js";
import { VoiceAgent } from "../services/voiceAgent.js";
import { queryKnowledgeBase } from "../services/knowledgeBase.js";
import { scheduleRetry, cancelRetry } from "../services/callScheduler.js";
import { protect, authorize } from "../middleware/auth.js";
import confirmAppointments from "../utils/confirmAppointments.js";
import { validateSlot } from "../utils/slotGenerator.js";

const router = Router();

const activeCalls = new Map();

const voiceFunctions = [
  {
    name: "set_do_not_call",
    description: "Mark the patient as do-not-call when they ask to stop receiving calls",
    parameters: {
      type: "object",
      properties: {
        reason: { type: "string", description: "Why the patient wants to stop calls" },
      },
      required: ["reason"],
    },
  },
  {
    name: "schedule_appointment",
    description: "Schedule a follow-up appointment for the patient with date, time, location, and reason",
    parameters: {
      type: "object",
      properties: {
        date: { type: "string", description: "Date in YYYY-MM-DD format" },
        time: { type: "string", description: "Time in HH:MM format (24h)" },
        place: { type: "string", description: "Location, clinic name, or 'phone' for phone call" },
        reason: { type: "string", description: "Reason for appointment" },
        type: { type: "string", enum: ["in-person", "phone", "video"], description: "Appointment type" },
      },
      required: ["date", "time", "place"],
    },
  },
  {
    name: "reschedule_appointment",
    description: "Reschedule an existing appointment to a new date/time",
    parameters: {
      type: "object",
      properties: {
        appointmentId: { type: "string", description: "The appointment ID to reschedule" },
        newDate: { type: "string", description: "New date in YYYY-MM-DD format" },
        newTime: { type: "string", description: "New time in HH:MM format" },
        reason: { type: "string", description: "Why the appointment is being rescheduled" },
      },
      required: ["appointmentId", "newDate", "newTime"],
    },
  },
  {
    name: "cancel_appointment",
    description: "Cancel an existing appointment",
    parameters: {
      type: "object",
      properties: {
        appointmentId: { type: "string", description: "The appointment ID to cancel" },
        reason: { type: "string", description: "Why the appointment is being cancelled" },
      },
      required: ["appointmentId"],
    },
  },
  {
    name: "transfer_to_human",
    description: "Transfer the call to a human operator",
    parameters: {
      type: "object",
      properties: {
        reason: { type: "string", description: "Why the call needs a human" },
      },
      required: ["reason"],
    },
  },
  {
    name: "update_patient_info",
    description: "Update patient medical information",
    parameters: {
      type: "object",
      properties: {
        field: {
          type: "string",
          enum: ["allergies", "medications", "symptoms", "emergency_contact", "address"],
          description: "Field to update",
        },
        value: { type: "string", description: "New value" },
      },
      required: ["field", "value"],
    },
  },
  {
    name: "get_patient_info",
    description: "Get patient information from the system",
    parameters: {
      type: "object",
      properties: {
        field: {
          type: "string",
          enum: ["allergies", "medications", "diagnosis", "last_visit", "all"],
          description: "What info to retrieve",
        },
      },
      required: ["field"],
    },
  },
  {
    name: "get_upcoming_appointments",
    description: "Look up the patient's upcoming scheduled appointments to tell them what appointments they have",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "get_available_slots",
    description: "Check what appointment times are available on a given date",
    parameters: {
      type: "object",
      properties: {
        date: { type: "string", description: "Date in YYYY-MM-DD format" },
      },
      required: ["date"],
    },
  },
  {
    name: "end_call",
    description: "End the current call politely",
    parameters: {
      type: "object",
      properties: {
        reason: { type: "string", description: "Why the call is ending" },
      },
      required: ["reason"],
    },
  },
];

async function handleFunctionCall(callId, functionName, args) {
  const callData = activeCalls.get(callId);
  if (!callData) return { error: "Call not found" };

  try {
    switch (functionName) {
      case "set_do_not_call": {
        const callForDnc = await Call.findById(callId);
        if (callForDnc) {
          const patientForDnc = await Patient.findById(callForDnc.patient);
          if (patientForDnc) {
            patientForDnc.doNotCall = true;
            patientForDnc.doNotCallReason = args.reason || "Patient request";
            await patientForDnc.save();
          }
        }
        return { success: true, message: "I've noted that. You will not receive further calls from us." };
      }
      case "get_upcoming_appointments": {
        const callForAppts = await Call.findById(callId).populate("patient");
        if (!callForAppts?.patient) return { error: "Patient not found" };
        const upcomingAppts = await Appointment.find({
          patient: callForAppts.patient._id,
          date: { $gte: new Date() },
          status: { $in: ["scheduled", "confirmed"] },
        }).sort({ date: 1 }).limit(5).select("title date duration reason status");
        if (upcomingAppts.length === 0) {
          return { appointments: [], message: "No upcoming appointments found" };
        }
        return {
          appointments: upcomingAppts.map((a) => ({
            id: a._id.toString(),
            title: a.title,
            date: a.date.toISOString().split("T")[0],
            time: a.date.toTimeString().slice(0, 5),
            reason: a.reason || "",
            status: a.status,
          })),
          message: `Found ${upcomingAppts.length} upcoming appointment(s)`,
        };
      }

      case "get_available_slots": {
        const callForSlots = await Call.findById(callId);
        const orgId = callForSlots?.organization || (await (await import("../models/Patient.js")).default.findById(callData.patientId))?.organization;
        if (!orgId) return { error: "Organization not found" };
        const { getAvailableSlots } = await import("../utils/slotGenerator.js");
        const slots = await getAvailableSlots(orgId, args.date, null);
        if (slots.length === 0) {
          return { slots: [], message: "No available slots on this date" };
        }
        return {
          slots: slots.map((s) => ({ time: s.time, endTime: s.endTime })),
          date: args.date,
          message: `Available times on ${args.date}: ${slots.map((s) => s.time).join(", ")}`,
        };
      }

      case "schedule_appointment": {
        const call = await Call.findById(callId).populate("patient");
        const orgId = call?.organization || callData.organizationId;
        if (!orgId) return { error: "Organization not found" };

        if (args.date && args.time) {
          const check = await validateSlot(orgId, args.date, args.time, 30, null);
          if (!check.valid) {
            return {
              error: "Slot not available",
              message: `That time is not available. Try: ${check.alternatives?.join(", ") || "a different time"}`,
              alternatives: check.alternatives,
            };
          }
        }

        if (call) {
          call.nextAppointmentDate = new Date(args.date);
          call.nextAppointmentPlace = args.place;
          await call.save();
        }
        const appointmentDate = args.time
          ? new Date(`${args.date}T${args.time}:00`)
          : new Date(args.date);
        const appointment = await Appointment.create({
          patient: call?.patient?._id || callData.patientId,
          organization: orgId,
          call: callId,
          title: `Follow-up: ${args.reason || "Checkup"}`,
          date: appointmentDate,
          location: args.place,
          type: args.type || "in-person",
          reason: args.reason || "",
          status: "scheduled",
        });
        return {
          success: true,
          appointmentId: appointment._id.toString(),
          message: `Appointment scheduled for ${args.date} at ${args.time || "09:00"} at ${args.place}. I've noted the reason: ${args.reason || "general checkup"}.`,
        };
      }

      case "reschedule_appointment": {
        const existing = await Appointment.findById(args.appointmentId);
        if (!existing) return { error: "Appointment not found" };

        if (args.newDate && args.newTime) {
          const check = await validateSlot(existing.organization, args.newDate, args.newTime, existing.duration || 30, existing.provider);
          if (!check.valid) {
            return {
              error: "Slot not available",
              message: `That time is not available. Try: ${check.alternatives?.join(", ") || "a different time"}`,
              alternatives: check.alternatives,
            };
          }
        }

        const newDate = args.newTime
          ? new Date(`${args.newDate}T${args.newTime}:00`)
          : new Date(args.newDate);
        existing.date = newDate;
        existing.status = "scheduled";
        existing.notes = existing.notes
          ? `${existing.notes}\nRescheduled: ${args.reason || "Patient request"}`
          : `Rescheduled: ${args.reason || "Patient request"}`;
        await existing.save();
        return { success: true, message: `Appointment rescheduled to ${args.newDate} at ${args.newTime || "09:00"}.` };
      }

      case "cancel_appointment": {
        const toCancel = await Appointment.findById(args.appointmentId);
        if (!toCancel) return { error: "Appointment not found" };
        toCancel.status = "cancelled";
        toCancel.notes = toCancel.notes
          ? `${toCancel.notes}\nCancelled: ${args.reason || "Patient request"}`
          : `Cancelled: ${args.reason || "Patient request"}`;
        await toCancel.save();
        return { success: true, message: `Appointment cancelled. Reason: ${args.reason || "Patient request"}.` };
      }

      case "transfer_to_human": {
        const callForTransfer = await Call.findById(callId).populate("patient");
        let contextSummary = { reason: args.reason || "Patient request", transcriptSnippets: [] };
        if (callForTransfer) {
          callForTransfer.status = "transferred";
          if (callForTransfer.transcript && callForTransfer.transcript.length > 0) {
            const lastTurns = callForTransfer.transcript.slice(-5);
            contextSummary.transcriptSnippets = lastTurns.map((t, i) => ({
              role: i % 2 === 0 ? "assistant" : "user",
              text: (t.question || t.answer || "").substring(0, 200),
            }));
          }
          callForTransfer.transferReason = args.reason || "Patient request";
          await callForTransfer.save();
        }
        return {
          success: true,
          transfer: true,
          message: "Transferring to human operator",
          context: contextSummary,
          callId,
        };
      }

      case "update_patient_info": {
        const call = await Call.findById(callId);
        if (call) {
          const patient = await Patient.findById(call.patient);
          if (patient) {
            const fieldMap = {
              allergies: "allergies",
              medications: "currentMedications",
              symptoms: "medicalNotes",
              emergency_contact: "emergencyContact",
              address: "address",
            };
            const dbField = fieldMap[args.field];
            if (dbField) {
              patient[dbField] = args.value;
              await patient.save();
            }
          }
        }
        return { success: true, message: `Updated ${args.field}` };
      }

      case "get_patient_info": {
        const call = await Call.findById(callId).populate("patient");
        if (!call?.patient) return { error: "Patient not found" };
        const p = call.patient;
        if (args.field === "all") {
          return {
            allergies: p.allergies || "None recorded",
            medications: p.currentMedications || "None recorded",
            diagnosis: p.primaryDiagnosis || "None recorded",
            lastVisit: p.lastCheckupDate || "No previous visit",
          };
        }
        const fieldMap = {
          allergies: p.allergies,
          medications: p.currentMedications,
          diagnosis: p.primaryDiagnosis,
          last_visit: p.lastCheckupDate,
        };
        return { [args.field]: fieldMap[args.field] || "Not found" };
      }

      case "end_call": {
        return { success: true, endCall: true, message: "Call ended" };
      }

      default:
        return { error: `Unknown function: ${functionName}` };
    }
  } catch (error) {
    return { error: error.message };
  }
}

router.post("/twilio/incoming", async (req, res) => {
  const callSid = req.body.CallSid;
  const from = req.body.From;
  const to = req.body.To;

  const patient = await Patient.findOne({ phone: from });
  if (!patient) {
    res.type("text/xml").send(`<?xml version="1.0" encoding="UTF-8"?>
      <Response>
        <Say voice="alice" language="en-US">Sorry, we could not find your record in our system. Please contact your healthcare provider directly.</Say>
      </Response>`);
    return;
  }

  const upcomingAppt = await Appointment.findOne({
    patient: patient._id,
    date: { $gte: new Date() },
    status: "scheduled",
  }).sort({ date: 1 }).limit(1);

  const defaultQuestionnaire = await Questionnaire.findOne({
    isDefault: true,
    isActive: true,
  }).sort({ createdAt: -1 }).limit(1);

  let call = await Call.findOne({ twilioCallSid: callSid });
  if (!call) {
    call = await Call.create({
      patient: patient._id,
      startedBy: patient.assignedDoctor || (await getUserById(patient.createdBy)),
      status: "in-progress",
      startedAt: new Date(),
      twilioCallSid: callSid,
      language: patient.language || "en",
      questionnaire: defaultQuestionnaire?._id || null,
      customQuestions: [],
      summary: `Inbound call from ${patient.name}`,
    });
  }

  activeCalls.set(call._id.toString(), {
    callSid,
    patientId: patient._id,
    callId: call._id,
  });

  res.type("text/xml").send(`<?xml version="1.0" encoding="UTF-8"?>
    <Response>
      <Connect>
        <Stream url="wss://${req.headers.host}/media-stream/${call._id}" />
      </Connect>
    </Response>`);
});

router.post("/twilio/status", async (req, res) => {
  const callSid = req.body.CallSid;
  const callStatus = req.body.CallStatus;

  const call = await Call.findOne({ twilioCallSid: callSid });
  if (call) {
    if (["completed", "failed", "busy", "no-answer"].includes(callStatus)) {
      const isHumanAnswer = callStatus === "completed";
      call.status = isHumanAnswer ? "completed" : "failed";
      call.endedAt = new Date();
      if (call.startedAt) {
        call.duration = Math.floor((new Date() - call.startedAt) / 1000);
      }
      await call.save();
      activeCalls.delete(call._id.toString());

      if (!isHumanAnswer && callStatus !== "failed") {
        cancelRetry(call._id.toString());
        scheduleRetry(call._id.toString(), (call.recallCount || 0) + 1);
      }
    }
  }

  res.sendStatus(200);
});

router.post("/outbound", protect, authorize("admin", "doctor", "nurse"), async (req, res) => {
  try {
    const { patientId, questionnaireId, customQuestions } = req.body;
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }
    if (!patient.phone) {
      return res.status(400).json({ message: "Patient has no phone number" });
    }
    if (patient.doNotCall) {
      return res.status(400).json({ message: "Patient has opted out of calls", doNotCall: true });
    }
    if (!process.env.TWILIO_ACCOUNT_SID) {
      return res.status(400).json({ message: "Twilio not configured" });
    }

    const patientLanguage = patient.language || "en";

    const call = await Call.create({
      patient: patient._id,
      questionnaire: questionnaireId || null,
      customQuestions: customQuestions || [],
      startedBy: req.user._id,
      status: "in-progress",
      startedAt: new Date(),
      language: patientLanguage,
    });

    const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    const serverUrl = process.env.SERVER_URL || `${req.protocol}://${req.headers.host}`;

    const twilioCall = await twilioClient.calls.create({
      to: patient.phone,
      from: process.env.TWILIO_PHONE_NUMBER,
      url: `${serverUrl}/api/voice/twilio/outbound-twiml/${call._id}`,
      statusCallback: `${serverUrl}/api/voice/twilio/status`,
      statusCallbackEvent: ["completed", "failed", "busy", "no-answer"],
      machineDetection: "DetectMessageEnd",
      machineDetectionTimeout: 8,
      asyncAmd: "true",
      asyncAmdStatusCallback: `${serverUrl}/api/voice/amd-status/${call._id}`,
    });

    call.twilioCallSid = twilioCall.sid;
    await call.save();

    confirmAppointments(patient._id, call._id);

    activeCalls.set(call._id.toString(), {
      callSid: twilioCall.sid,
      patientId: patient._id,
      callId: call._id,
    });

    res.status(201).json({ call });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/twilio/outbound-twiml/:callId", async (req, res) => {
  const call = await Call.findById(req.params.callId).populate("patient");
  if (!call) {
    return res.status(404).send("Call not found");
  }

  const serverUrl = process.env.SERVER_URL || `${req.protocol}://${req.headers.host}`;
  const practiceName = process.env.PRACTICE_NAME || "Your Healthcare Provider";
  const callbackNumber = process.env.TWILIO_PHONE_NUMBER || "your provider";

  res.type("text/xml").send(`<?xml version="1.0" encoding="UTF-8"?>
    <Response>
      <Connect>
        <Stream url="wss://${serverUrl.replace(/^https?:\/\//, "")}/media-stream/${call._id}" />
      </Connect>
    </Response>`);
});

router.post("/twilio/amd-status/:callId", async (req, res) => {
  const { CallSid, AnsweredBy, MachineDetectionDuration } = req.body;

  if (AnsweredBy === "machine_start" || AnsweredBy === "machine_end" || AnsweredBy === "machine") {
    const call = await Call.findById(req.params.callId).populate("patient", "name");
    if (call) {
      call.status = "failed";
      call.endedAt = new Date();
      const practiceName = process.env.PRACTICE_NAME || "your healthcare provider";
      const patientName = call.patient?.name || "";
      call.notes = call.notes
        ? `${call.notes}\nVoicemail detected — callback message left`
        : "Voicemail detected — callback message left";
      await call.save();
      cancelRetry(call._id.toString());
      scheduleRetry(call._id.toString(), (call.recallCount || 0) + 1);

      try {
        const twilioClientVm = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        await twilioClientVm.calls(CallSid).update({
          twiml: `<Response><Say voice="alice" language="en-US">This is a message from ${practiceName} returning your call. We will try you again later. If you need to reach us sooner, please call us back. Thank you.</Say></Response>`,
        });
        console.log(`[${req.params.callId}] Voicemail message left for ${patientName}`);
      } catch (vmError) {
        console.error(`[${req.params.callId}] Voicemail message error:`, vmError.message);
      }
    }
  }

  res.sendStatus(200);
});

router.post("/knowledge/ingest", protect, authorize("admin"), async (req, res) => {
  try {
    const { documents: docs } = req.body;
    if (!docs || !Array.isArray(docs)) {
      return res.status(400).json({ message: "Documents array required" });
    }

    const results = [];
    for (const doc of docs) {
      const { addDocument } = await import("../services/knowledgeBase.js");
      const chunks = addDocument(doc.id, doc.title, doc.content, doc.metadata || {});
      results.push({ id: doc.id, title: doc.title, chunks });
    }

    res.json({ ingested: results });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/knowledge/documents", protect, async (req, res) => {
  const { getDocuments } = await import("../services/knowledgeBase.js");
  res.json({ documents: getDocuments() });
});

router.delete("/knowledge/documents/:id", protect, authorize("admin"), async (req, res) => {
  const { removeDocument } = await import("../services/knowledgeBase.js");
  const count = removeDocument(req.params.id);
  res.json({ removed: count });
});

router.put("/:patientId/do-not-call", protect, authorize("admin", "doctor", "nurse"), async (req, res) => {
  try {
    const patient = await Patient.findByIdAndUpdate(
      req.params.patientId,
      { doNotCall: req.body.doNotCall, doNotCallReason: req.body.reason || "" },
      { new: true }
    );
    if (!patient) return res.status(404).json({ message: "Patient not found" });
    res.json({ patient });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/transfer/:callId", protect, authorize("admin", "doctor", "nurse"), async (req, res) => {
  try {
    const call = await Call.findById(req.params.callId)
      .populate("patient", "name phone language dateOfBirth")
      .populate("startedBy", "name email");
    if (!call) return res.status(404).json({ message: "Call not found" });

    const lastTranscript = call.transcript
      ?.slice(-5)
      .map((t, i) => ({
        role: i % 2 === 0 ? "assistant" : "user",
        text: (t.question || t.answer || ""),
      })) || [];

    res.json({
      call: {
        _id: call._id,
        status: call.status,
        language: call.language,
        duration: call.duration,
        startedAt: call.startedAt,
        transferReason: call.transferReason,
        triageTier: call.triageTier,
        highestTier: call.highestTier,
        redFlags: call.redFlags,
      },
      patient: call.patient,
      startedBy: call.startedBy,
      recentTranscript: lastTranscript,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/twilio/gather", async (req, res) => {
  const digits = req.body.Digits;
  res.type("text/xml").send(`<?xml version="1.0" encoding="UTF-8"?>
    <Response>
      <Say voice="alice">You pressed ${digits}. Connecting you to the AI voice agent.</Say>
      <Connect>
        <Stream url="wss://${req.headers.host}/media-stream/${req.body.callId || "gather"}" />
      </Connect>
    </Response>`);
});

export { activeCalls, handleFunctionCall, voiceFunctions };
export default router;

async function getUserById(id) {
  const User = (await import("../models/User.js")).default;
  return id;
}
