import Appointment from "../models/Appointment.js";
import User from "../models/User.js";
import Patient from "../models/Patient.js";
import { createOrUpdateEvent, deleteEvent, fetchEvents } from "./calendarService.js";
import { logger } from "../utils/logger.js";

let syncInterval = null;

export async function syncCalendar(user) {
  const results = { outboundCreated: 0, outboundUpdated: 0, inboundCreated: 0, inboundUpdated: 0, errors: 0 };

  try {
    const appointments = await Appointment.find({
      provider: user._id,
      date: { $gte: new Date(Date.now() - 7 * 24 * 3600 * 1000) },
      status: { $nin: ["cancelled", "no-show"] },
    }).populate("patient", "name email phone");

    for (const apt of appointments) {
      try {
        const event = await createOrUpdateEvent(apt, user);
        if (event) {
          if (apt.googleCalendarEventId) results.outboundUpdated++;
          else results.outboundCreated++;
        }
      } catch (err) {
        results.errors++;
      }
    }

    const gEvents = await fetchEvents(user);
    const existingIds = new Set(
      appointments.filter((a) => a.googleCalendarEventId).map((a) => a.googleCalendarEventId)
    );

    for (const gEvent of gEvents) {
      if (!gEvent.id || existingIds.has(gEvent.id)) continue;
      if (!gEvent.start?.dateTime) continue;

      const startTime = new Date(gEvent.start.dateTime);
      const endTime = gEvent.end?.dateTime ? new Date(gEvent.end.dateTime) : new Date(startTime.getTime() + 30 * 60000);
      const duration = Math.round((endTime - startTime) / 60000);

      const existing = await Appointment.findOne({
        provider: user._id,
        date: startTime,
        status: { $nin: ["cancelled", "no-show"] },
      });

      if (!existing) {
        await Appointment.create({
          provider: user._id,
          organization: user.organization,
          patient: null,
          title: gEvent.summary || "Calendar Event",
          date: startTime,
          duration,
          status: "scheduled",
          notes: `Synced from Google Calendar. ${gEvent.description || ""}`,
          googleCalendarEventId: gEvent.id,
          googleCalendarEventLink: gEvent.htmlLink || "",
          googleCalendarLastSynced: new Date(),
          bookedBy: user._id,
        });
        results.inboundCreated++;
      }
    }
  } catch (err) {
    logger.error("CalendarSync", `Sync error for user ${user._id}: ${err.message}`);
    results.errors++;
  }

  return results;
}

export async function syncAllUsers() {
  const users = await User.find({
    googleCalendarConnected: true,
    googleRefreshToken: { $ne: "" },
    isActive: true,
  });

  let total = { outboundCreated: 0, outboundUpdated: 0, inboundCreated: 0, inboundUpdated: 0, errors: 0 };

  for (const user of users) {
    const result = await syncCalendar(user);
    total.outboundCreated += result.outboundCreated;
    total.outboundUpdated += result.outboundUpdated;
    total.inboundCreated += result.inboundCreated;
    total.inboundUpdated += result.inboundUpdated;
    total.errors += result.errors;
  }

  if (total.outboundCreated > 0 || total.inboundCreated > 0) {
    logger.info("CalendarSync", `Sync complete: ${total.outboundCreated} created, ${total.outboundUpdated} updated outbound, ${total.inboundCreated} created inbound, ${total.errors} errors`);
  }

  return total;
}

export function startCalendarSync() {
  syncAllUsers();
  syncInterval = setInterval(syncAllUsers, 5 * 60 * 1000);
}

export function stopCalendarSync() {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }
}
