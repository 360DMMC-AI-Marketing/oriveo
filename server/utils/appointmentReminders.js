import Appointment from "../models/Appointment.js";
import Patient from "../models/Patient.js";
import Organization from "../models/Organization.js";
import { sendSms } from "../services/alertService.js";
import { sendEmail } from "../services/emailService.js";
import { logger } from "./logger.js";

let intervalHandle = null;

export async function sendDayBeforeReminders() {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const endOfTomorrow = new Date(tomorrow);
    endOfTomorrow.setHours(23, 59, 59, 999);

    const appointments = await Appointment.find({
      date: { $gte: tomorrow, $lte: endOfTomorrow },
      status: { $in: ["scheduled", "confirmed"] },
      "reminders.type": { $ne: "reminder" },
    }).populate("patient", "name phone email reminderPreferences").populate("organization", "name settings");

    for (const apt of appointments) {
      const patient = apt.patient;
      if (!patient) continue;

      const aptDate = new Date(apt.date);
      const timeStr = aptDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
      const dateStr = aptDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
      const orgName = apt.organization?.name || "the clinic";

      if (patient.phone) {
        await sendSms(patient.phone, `Reminder: You have an appointment tomorrow (${dateStr}) at ${timeStr} at ${orgName}. Reply or call to reschedule if needed.`);
      }

      if (patient.email && patient.reminderPreferences?.email !== false) {
        await sendEmail({
          to: patient.email,
          subject: `Appointment Reminder — ${dateStr}`,
          html: `<p>This is a reminder for your appointment:</p><p><strong>Date:</strong> ${dateStr}<br><strong>Time:</strong> ${timeStr}<br><strong>Location:</strong> ${orgName}</p><p>If you need to reschedule, please contact the clinic.</p>`,
        });
      }

      await Appointment.findByIdAndUpdate(apt._id, {
        $push: { reminders: { channel: "email", sentAt: new Date(), type: "reminder" } },
        reminderSent: true,
        reminderScheduledAt: new Date(),
      });
    }

    if (appointments.length > 0) {
      logger.info("Reminders", `Sent ${appointments.length} day-before reminders`);
    }
  } catch (err) {
    logger.error("Reminders", err.message);
  }
}

export async function sendSameDayReminders() {
  try {
    const now = new Date();
    const twoHoursLater = new Date(now.getTime() + 2 * 3600 * 1000);

    const appointments = await Appointment.find({
      date: { $gte: now, $lte: twoHoursLater },
      status: { $in: ["scheduled", "confirmed"] },
      "reminders.type": { $ne: "followup" },
    }).populate("patient", "name phone email reminderPreferences").populate("organization", "name settings");

    for (const apt of appointments) {
      const patient = apt.patient;
      if (!patient) continue;

      const aptDate = new Date(apt.date);
      const timeStr = aptDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
      const dateStr = aptDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
      const orgName = apt.organization?.name || "the clinic";

      if (patient.phone) {
        await sendSms(patient.phone, `Reminder: Your appointment is today (${dateStr}) at ${timeStr} at ${orgName}. See you soon!`);
      }

      if (patient.email && patient.reminderPreferences?.email !== false) {
        await sendEmail({
          to: patient.email,
          subject: `Today's Appointment — ${timeStr}`,
          html: `<p>This is a reminder for your appointment <strong>today</strong>:</p><p><strong>Date:</strong> ${dateStr}<br><strong>Time:</strong> ${timeStr}<br><strong>Location:</strong> ${orgName}</p>`,
        });
      }

      await Appointment.findByIdAndUpdate(apt._id, {
        $push: { reminders: { channel: "email", sentAt: new Date(), type: "followup" } },
      });
    }

    if (appointments.length > 0) {
      logger.info("Reminders", `Sent ${appointments.length} same-day reminders`);
    }
  } catch (err) {
    logger.error("Reminders", err.message);
  }
}

export function startReminderScheduler() {
  const run = () => {
    const now = new Date();
    if (now.getHours() === 8 && now.getMinutes() === 0) {
      sendDayBeforeReminders();
    }
    if (now.getMinutes() % 15 === 0) {
      sendSameDayReminders();
    }
  };
  run();
  intervalHandle = setInterval(run, 60 * 1000);
}

export function stopReminderScheduler() {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
  }
}
