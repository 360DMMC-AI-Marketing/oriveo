import Notification from "../models/Notification.js";
import User from "../models/User.js";
import { getIo } from "./socketManager.js";

export async function createNotification({ user, type, title, message, link, call, patient }) {
  if (!user) return null;

  try {
    const notif = await Notification.create({ user, type, title, message, link: link || "", call: call || null, patient: patient || null });

    const io = getIo();
    if (io) {
      const populated = await Notification.findById(notif._id).populate("patient", "name phone").lean();
      io.to(`user:${user}`).emit("notification:new", populated);
    }

    return notif;
  } catch (error) {
    console.error("Notification create error:", error.message);
    return null;
  }
}

export async function notifyForAppointment(appointment) {
  if (!appointment) return;

  try {
    const orgId = appointment.organization;
    const providerId = appointment.provider;
    const patient = appointment.patient;

    const aptDate = new Date(appointment.date);
    const timeStr = aptDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    const dateStr = aptDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
    const patientName = patient?.name || "A patient";
    const link = "/calendar";

    const receptionists = await User.find({ organization: orgId, role: "receptionist", isActive: true }).select("_id");

    const promises = [];

    for (const rec of receptionists) {
      promises.push(createNotification({
        user: rec._id,
        type: "appointment_pending",
        title: "New Appointment",
        message: `${patientName} — ${dateStr} at ${timeStr}`,
        link,
        patient: patient?._id || null,
      }));
    }

    if (providerId) {
      promises.push(createNotification({
        user: providerId,
        type: "appointment_confirmed",
        title: "Appointment Scheduled",
        message: `${patientName} — ${dateStr} at ${timeStr}`,
        link,
        patient: patient?._id || null,
      }));
    }

    await Promise.all(promises);
  } catch (error) {
    console.error("notifyForAppointment error:", error.message);
  }
}

export async function notifyForCall(callDoc) {
  if (!callDoc || !callDoc.patient) return;

  try {
    const patient = callDoc.patient;
    const assignedDoctor = patient.assignedDoctor;
    const severity = callDoc.aiSeverityScore || 0;
    const link = `/calls/${callDoc._id}`;
    const patientName = patient.name || "Unknown";
    const isEmergency = callDoc.emergencyDetected || severity >= 7;
    const isHighSeverity = severity >= 7;
    const isInbound = callDoc.direction === "inbound";

    if (isEmergency && assignedDoctor) {
      await createNotification({
        user: assignedDoctor,
        type: "emergency",
        title: "🚨 Medical Emergency",
        message: `Emergency detected during ${isInbound ? "inbound" : "outbound"} call with ${patientName} (Severity: ${severity}/10)`,
        link,
        call: callDoc._id,
        patient: patient._id,
      });
    }

    if (isHighSeverity && assignedDoctor) {
      await createNotification({
        user: assignedDoctor,
        type: "high_severity",
        title: "⚠️ High Severity Call",
        message: `${patientName} — Severity score ${severity}/10. Review and follow up required.`,
        link,
        call: callDoc._id,
        patient: patient._id,
      });
    }

    if (isInbound && assignedDoctor && callDoc.status === "completed" && callDoc.patientResponded) {
      await createNotification({
        user: assignedDoctor,
        type: "inbound_completed",
        title: "📞 Inbound Call Completed",
        message: `${patientName} completed an inbound checkup call. ${callDoc.aiSummary ? "Summary: " + callDoc.aiSummary.substring(0, 80) : ""}`,
        link,
        call: callDoc._id,
        patient: patient._id,
      });
    }

    if (isInbound && assignedDoctor) {
      await createNotification({
        user: assignedDoctor,
        type: "inbound_received",
        title: "📞 Inbound Call Received",
        message: `${patientName} called in for a health checkup.`,
        link,
        call: callDoc._id,
        patient: patient._id,
      });
    }

    if (callDoc.status === "failed" && assignedDoctor) {
      await createNotification({
        user: assignedDoctor,
        type: "call_failed",
        title: "❌ Call Failed",
        message: `${isInbound ? "Inbound" : "Outbound"} call with ${patientName} failed. Patient did not respond.`,
        link,
        call: callDoc._id,
        patient: patient._id,
      });
    }

    if (callDoc.aiRecommendations?.toLowerCase().includes("follow") && assignedDoctor) {
      await createNotification({
        user: assignedDoctor,
        type: "follow_up_needed",
        title: "📋 Follow-up Needed",
        message: `${patientName} requires a follow-up. ${callDoc.aiRecommendations?.substring(0, 100) || ""}`,
        link,
        call: callDoc._id,
        patient: patient._id,
      });
    }

    if (callDoc.status === "transferred") {
      const notificationPromises = [];
      if (assignedDoctor) {
        notificationPromises.push(createNotification({
          user: assignedDoctor,
          type: "call_transferred",
          title: "📞 Call Transferred",
          message: `${isInbound ? "Inbound" : "Outbound"} call with ${patientName} was transferred to a human operator. Reason: ${callDoc.transferReason || "Not specified"}`,
          link,
          call: callDoc._id,
          patient: patient._id,
        }));
      }
      await Promise.all(notificationPromises);
    }
  } catch (error) {
    console.error("notifyForCall error:", error.message);
  }
}
