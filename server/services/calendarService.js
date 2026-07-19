import { google } from "googleapis";
import User from "../models/User.js";
import Appointment from "../models/Appointment.js";
import { logger } from "../utils/logger.js";

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || "http://localhost:5000/api/calendar/oauth-callback";

function getOAuth2Client() {
  if (!CLIENT_ID || !CLIENT_SECRET) return null;
  return new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
}

async function getAuthForUser(userId) {
  const user = await User.findById(userId).select("googleRefreshToken googleCalendarConnected googleCalendarEmail");
  if (!user || !user.googleCalendarConnected || !user.googleRefreshToken) return null;

  const oauth2Client = getOAuth2Client();
  if (!oauth2Client) return null;

  oauth2Client.setCredentials({ refresh_token: user.googleRefreshToken });

  try {
    const { credentials } = await oauth2Client.refreshAccessToken();
    oauth2Client.setCredentials(credentials);
    return oauth2Client;
  } catch (err) {
    logger.error("CalendarAuth", `Failed to refresh token for user ${userId}: ${err.message}`);
    await User.findByIdAndUpdate(userId, { googleCalendarConnected: false, googleRefreshToken: "" });
    return null;
  }
}

export async function createOrUpdateEvent(appointment, user) {
  try {
    const auth = await getAuthForUser(user._id || user);
    if (!auth) return null;

    const calendar = google.calendar({ version: "v3", auth });
    const patientName = appointment.patient?.name || "Patient";
    const aptDate = new Date(appointment.date);
    const endDate = new Date(aptDate.getTime() + (appointment.duration || 30) * 60000);

    const event = {
      summary: appointment.title || "Appointment",
      description: `Patient: ${patientName}\nReason: ${appointment.reason || ""}\nNotes: ${appointment.notes || ""}`,
      start: { dateTime: aptDate.toISOString(), timeZone: "UTC" },
      end: { dateTime: endDate.toISOString(), timeZone: "UTC" },
      location: appointment.location || "",
      reminders: {
        useDefault: true,
      },
    };

    if (appointment.googleCalendarEventId) {
      const response = await calendar.events.update({
        calendarId: "primary",
        eventId: appointment.googleCalendarEventId,
        requestBody: event,
      });
      return response.data;
    } else {
      const response = await calendar.events.insert({
        calendarId: "primary",
        requestBody: event,
      });

      await Appointment.findByIdAndUpdate(appointment._id, {
        googleCalendarEventId: response.data.id,
        googleCalendarEventLink: response.data.htmlLink,
        googleCalendarLastSynced: new Date(),
      });

      return response.data;
    }
  } catch (err) {
    logger.error("CalendarEvent", `Failed to create/update event: ${err.message}`);
    return null;
  }
}

export async function deleteEvent(appointment, user) {
  try {
    if (!appointment.googleCalendarEventId) return null;

    const auth = await getAuthForUser(user._id || user);
    if (!auth) return null;

    const calendar = google.calendar({ version: "v3", auth });
    await calendar.events.delete({
      calendarId: "primary",
      eventId: appointment.googleCalendarEventId,
    });

    await Appointment.findByIdAndUpdate(appointment._id, {
      $unset: { googleCalendarEventId: "", googleCalendarEventLink: "" },
    });

    return true;
  } catch (err) {
    logger.error("CalendarEvent", `Failed to delete event: ${err.message}`);
    return null;
  }
}

export async function fetchEvents(user, timeMin, timeMax) {
  try {
    const auth = await getAuthForUser(user._id || user);
    if (!auth) return [];

    const calendar = google.calendar({ version: "v3", auth });
    const response = await calendar.events.list({
      calendarId: "primary",
      timeMin: timeMin || new Date().toISOString(),
      timeMax: timeMax || new Date(Date.now() + 90 * 24 * 3600 * 1000).toISOString(),
      singleEvents: true,
      orderBy: "startTime",
    });

    return response.data.items || [];
  } catch (err) {
    logger.error("CalendarEvents", `Failed to fetch events: ${err.message}`);
    return [];
  }
}
