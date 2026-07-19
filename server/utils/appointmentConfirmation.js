import Appointment from "../models/Appointment.js";
import Patient from "../models/Patient.js";
import Organization from "../models/Organization.js";
import { sendEmail } from "../services/emailService.js";
import { sendSms } from "../services/alertService.js";
import { logger } from "./logger.js";

export async function sendConfirmation(appointmentId) {
  try {
    const appointment = await Appointment.findById(appointmentId)
      .populate("patient", "name phone email reminderPreferences")
      .populate("organization", "name settings");

    if (!appointment || !appointment.patient) return;

    const patient = appointment.patient;
    const orgName = appointment.organization?.name || "the clinic";
    const aptDate = new Date(appointment.date);
    const dateStr = aptDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
    const timeStr = aptDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

    if (patient.phone) {
      await sendSms(patient.phone, `Confirmed: ${dateStr} at ${timeStr} at ${orgName}. Reply to reschedule.`);
    }

    if (patient.email && patient.reminderPreferences?.email) {
      await sendEmail({
        to: patient.email,
        subject: "Appointment Confirmed",
        html: `<p>Your appointment is confirmed:</p><p><strong>Date:</strong> ${dateStr}<br><strong>Time:</strong> ${timeStr}<br><strong>Location:</strong> ${orgName}</p>`,
      });
    }

    await Appointment.findByIdAndUpdate(appointmentId, {
      $push: { reminders: { channel: "email", sentAt: new Date(), type: "confirmation" } },
    });

    logger.info("Confirmation", `Sent confirmation for appointment ${appointmentId}`);
  } catch (err) {
    logger.error("Confirmation", err.message);
  }
}
