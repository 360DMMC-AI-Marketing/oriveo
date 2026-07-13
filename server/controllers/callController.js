import Call from "../models/Call.js";
import Patient from "../models/Patient.js";
import twilio from "twilio";
import { getIo } from "../services/socketManager.js";

function getTwilioClient() {
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_ACCOUNT_SID.startsWith("AC")) {
    return twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  }
  return null;
}

export const getCalls = async (req, res) => {
  try {
    const query = { ...req.tenantFilter };
    if (req.query.patientId) query.patient = req.query.patientId;
    if (req.query.status) query.status = req.query.status;
    if (req.query.direction) query.direction = req.query.direction;
    const calls = await Call.find(query)
      .populate("patient", "name phone")
      .populate("questionnaire", "title")
      .populate("startedBy", "name")
      .sort({ createdAt: -1 });
    res.json({ calls });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getCall = async (req, res) => {
  try {
    const call = await Call.findOne({ _id: req.params.id, ...req.tenantFilter })
      .populate("patient", "name phone language")
      .populate("questionnaire", "title questions")
      .populate("startedBy", "name");
    if (!call) {
      return res.status(404).json({ message: "Call not found" });
    }
    res.json({ call });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createCall = async (req, res) => {
  try {
    const { patient, questionnaire, scheduledAt, language, customQuestions } = req.body;
    const patientDoc = await Patient.findById(patient);
    if (!patientDoc) {
      return res.status(404).json({ message: "Patient not found" });
    }
    const call = await Call.create({
      organization: req.user.organization || null,
      patient,
      questionnaire,
      customQuestions: customQuestions || [],
      scheduledAt: scheduledAt || new Date(),
      startedBy: req.user._id,
      language: language || patientDoc.language || "en",
      status: scheduledAt ? "scheduled" : "in-progress",
    });

    if (!scheduledAt && process.env.TWILIO_ACCOUNT_SID) {
      try {
        const twilioCall = await getTwilioClient().calls.create({
          to: patientDoc.phone,
          from: process.env.TWILIO_PHONE_NUMBER,
          twiml: `<Response><Say>This is an automated medical checkup call. Please wait while we connect you.</Say></Response>`,
        });
        call.twilioCallSid = twilioCall.sid;
        call.status = "in-progress";
        call.startedAt = new Date();
        await call.save();
      } catch (twilioError) {
        console.error("Twilio call failed:", twilioError.message);
        call.status = "failed";
        await call.save();
      }
    }

    res.status(201).json({ call });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateCallStatus = async (req, res) => {
  try {
    const { status, audioUrl, aiSummary, aiSeverityScore, transcript, patientResponded, aiRecommendations } = req.body;
    const update = {};
    if (status) update.status = status;
    if (audioUrl) update.audioUrl = audioUrl;
    if (aiSummary) update.aiSummary = aiSummary;
    if (aiSeverityScore !== undefined) update.aiSeverityScore = aiSeverityScore;
    if (transcript) update.transcript = transcript;
    if (patientResponded !== undefined) update.patientResponded = patientResponded;
    if (aiRecommendations) update.aiRecommendations = aiRecommendations;
    if (status === "completed") update.endedAt = new Date();

    const call = await Call.findOneAndUpdate({ _id: req.params.id, ...req.tenantFilter }, update, { new: true });
    if (!call) {
      return res.status(404).json({ message: "Call not found" });
    }
    res.json({ call });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const recallCall = async (req, res) => {
  try {
    const call = await Call.findOne({ _id: req.params.id, ...req.tenantFilter }).populate("patient", "name phone language");
    if (!call) {
      return res.status(404).json({ message: "Call not found" });
    }

    call.recallCount = (call.recallCount || 0) + 1;
    call.status = "in-progress";
    call.scheduledAt = null;
    call.startedAt = new Date();

    if (process.env.TWILIO_ACCOUNT_SID) {
      try {
        const twilioCall = await getTwilioClient().calls.create({
          to: call.patient.phone,
          from: process.env.TWILIO_PHONE_NUMBER,
          twiml: `<Response><Say>This is an automated medical checkup call. Please wait while we connect you.</Say></Response>`,
        });
        call.twilioCallSid = twilioCall.sid;
      } catch (twilioError) {
        console.error("Twilio recall failed:", twilioError.message);
        call.status = "failed";
      }
    }

    await call.save();
    res.json({ call });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateCall = async (req, res) => {
  try {
    const { patient, questionnaire, scheduledAt, language, nextAppointmentDate, nextAppointmentPlace, customQuestions } = req.body;
    const call = await Call.findOne({ _id: req.params.id, ...req.tenantFilter });
    if (!call) {
      return res.status(404).json({ message: "Call not found" });
    }
    if (call.status === "completed") {
      return res.status(400).json({ message: "Cannot edit a completed call" });
    }
    if (patient) call.patient = patient;
    if (questionnaire !== undefined) call.questionnaire = questionnaire;
    if (customQuestions !== undefined) call.customQuestions = customQuestions;
    if (scheduledAt) call.scheduledAt = scheduledAt;
    if (language) call.language = language;
    if (nextAppointmentDate !== undefined) call.nextAppointmentDate = nextAppointmentDate || null;
    if (nextAppointmentPlace !== undefined) call.nextAppointmentPlace = nextAppointmentPlace || "";
    await call.save();
    res.json({ call });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteCall = async (req, res) => {
  try {
    const call = await Call.findOneAndDelete({ _id: req.params.id, ...req.tenantFilter });
    if (!call) {
      return res.status(404).json({ message: "Call not found" });
    }
    res.json({ message: "Call removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getPatientCallHistory = async (req, res) => {
  try {
    const calls = await Call.find({ ...req.tenantFilter, patient: req.params.patientId })
      .populate("questionnaire", "title")
      .sort({ createdAt: -1 });
    res.json({ calls });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const transferCall = async (req, res) => {
  try {
    const { reason } = req.body;
    const call = await Call.findOne({ _id: req.params.id, ...req.tenantFilter }).populate("patient", "name phone");
    if (!call) return res.status(404).json({ message: "Call not found" });
    if (call.status !== "in-progress") return res.status(400).json({ message: "Call is not in progress" });

    const humanNumber = process.env.HUMAN_TRANSFER_NUMBER;
    if (!humanNumber) return res.status(400).json({ message: "No transfer number configured. Set HUMAN_TRANSFER_NUMBER in Settings." });

    const { getCall } = await import("../services/callOrchestrator.js");
    const callData = getCall(call._id.toString());

    if (callData?.callSid && process.env.TWILIO_ACCOUNT_SID) {
      await getTwilioClient().calls(callData.callSid).update({
        twiml: `<Response><Dial>${humanNumber}</Dial></Response>`,
      });
    }

    call.status = "transferred";
    call.transferReason = reason || "Manual transfer requested by staff";
    call.endedAt = new Date();
    await call.save();

    const io = getIo();
    if (io) {
      io.to(`call:${call._id}`).emit("call-transferred", {
        callId: call._id,
        reason: call.transferReason,
        transferredBy: req.user.name || req.user._id,
        patientName: call.patient?.name || "Unknown",
      });
    }

    const { createNotification } = await import("../services/notificationService.js");
    if (call.patient?.assignedDoctor) {
      await createNotification({
        user: call.patient.assignedDoctor,
        type: "call_transferred",
        title: "📞 Call Transferred to Human",
        message: `${call.patient.name || "Patient"} was transferred to a human operator. Reason: ${call.transferReason}`,
        link: `/calls/${call._id}`,
        call: call._id,
        patient: call.patient._id,
      });
    }

    res.json({ message: "Call transferred to human operator", call });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getActiveCalls = async (req, res) => {
  try {
    const { getAllActiveCalls } = await import("../services/callOrchestrator.js");
    const active = getAllActiveCalls();

    const enriched = await Promise.all(
      active.map(async ([callId, data]) => {
        const callDoc = await Call.findById(callId)
          .populate("patient", "name phone")
          .populate("questionnaire", "title")
          .select("status direction language aiSeverityScore transcript startedAt");
        return {
          callId,
          callSid: data.callSid,
          streamSid: data.streamSid,
          startedAt: data.startedAt,
          duration: Date.now() - data.startedAt,
          patient: callDoc?.patient || null,
          status: callDoc?.status || "unknown",
          direction: callDoc?.direction || "outbound",
          language: callDoc?.language || "en",
          severity: callDoc?.aiSeverityScore || null,
          lastTranscript: callDoc?.transcript?.slice(-1)?.[0] || null,
        };
      })
    );

    res.json({ activeCalls: enriched, count: enriched.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const emergencyCall = async (req, res) => {
  try {
    const { target } = req.body;
    if (!target || !["911", "clinic"].includes(target)) {
      return res.status(400).json({ message: "Target must be '911' or 'clinic'" });
    }

    const call = await Call.findOne({ _id: req.params.id, ...req.tenantFilter }).populate("patient", "name phone");
    if (!call) return res.status(404).json({ message: "Call not found" });
    if (call.emergencyActionTaken !== "none") {
      return res.status(400).json({ message: `Emergency action already taken: ${call.emergencyActionTaken}` });
    }

    const numberToDial = target === "911"
      ? "911"
      : (process.env.CLINIC_EMERGENCY_NUMBER || process.env.HUMAN_TRANSFER_NUMBER);
    if (!numberToDial) {
      return res.status(400).json({ message: `No ${target} number configured` });
    }
    if (!process.env.TWILIO_ACCOUNT_SID) {
      return res.status(400).json({ message: "Twilio not configured" });
    }

    const patientInfo = call.patient
      ? `${call.patient.name || "Unknown patient"}, phone: ${call.patient.phone || "N/A"}`
      : "Unknown patient";

    const emergencyMessage = target === "911"
      ? `This is an automated emergency alert from Oriveo medical system. A patient requires immediate emergency assistance. Patient information: ${patientInfo}. The AI triage system has detected a medical emergency during a patient checkup call. Please dispatch emergency services.`
      : `This is an automated emergency alert from Oriveo medical system. A patient requires immediate clinical attention. Patient information: ${patientInfo}. The AI triage system has detected a medical emergency. Please call the patient back immediately.`;

    const emergencyCall = await getTwilioClient().calls.create({
      to: numberToDial,
      from: process.env.TWILIO_PHONE_NUMBER,
      twiml: `<Response><Say>${emergencyMessage}</Say></Response>`,
    });

    call.emergencyDetected = true;
    call.emergencyConfirmedBy = req.user._id;
    call.emergencyActionTaken = target === "911" ? "called_911" : "called_clinic";
    call.emergencyCalledAt = new Date();
    await call.save();

    const io = req.app.get("io");
    if (io) {
      io.to(`call:${call._id}`).emit("emergency-action-taken", {
        callId: call._id,
        target,
        action: call.emergencyActionTaken,
        calledAt: call.emergencyCalledAt,
        confirmedBy: req.user.name || req.user._id,
      });
      io.emit("emergency-broadcast", {
        callId: call._id,
        patientName: call.patient?.name || "Unknown",
        target,
        action: call.emergencyActionTaken,
      });
    }

    res.json({
      message: `Emergency call placed to ${target}`,
      twilioSid: emergencyCall.sid,
      call,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
