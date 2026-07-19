import { Router } from "express";
import { protect } from "../middleware/auth.js";
import { google } from "googleapis";
import User from "../models/User.js";

const router = Router();

router.use(protect);

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || "http://localhost:5000/api/calendar/oauth-callback";

function getOAuth2Client() {
  if (!CLIENT_ID || !CLIENT_SECRET) return null;
  return new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
}

router.get("/auth-url", async (req, res) => {
  try {
    const oauth2Client = getOAuth2Client();
    if (!oauth2Client) return res.status(400).json({ message: "Google Calendar not configured" });

    const url = oauth2Client.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      scope: ["https://www.googleapis.com/auth/calendar.events", "https://www.googleapis.com/auth/calendar.readonly"],
      state: req.user._id.toString(),
    });
    res.json({ url });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/oauth-callback", async (req, res) => {
  try {
    const { code, state } = req.query;
    if (!code || !state) return res.status(400).json({ message: "Missing code or state" });

    const oauth2Client = getOAuth2Client();
    if (!oauth2Client) return res.status(400).json({ message: "Google Calendar not configured" });

    const { tokens } = await oauth2Client.getToken(code);

    await User.findByIdAndUpdate(state, {
      googleCalendarConnected: true,
      googleRefreshToken: tokens.refresh_token || "",
      googleCalendarEmail: tokens.scope?.includes("calendar") ? "Connected" : "Unknown",
    });

    res.redirect(`${process.env.CLIENT_URL || "http://localhost:5173"}/settings/calendar?connected=true`);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/disconnect", async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, {
      googleCalendarConnected: false,
      googleRefreshToken: "",
      googleCalendarEmail: "",
    });
    res.json({ message: "Google Calendar disconnected" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/status", async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("googleCalendarConnected googleCalendarEmail");
    res.json({ connected: user?.googleCalendarConnected || false, email: user?.googleCalendarEmail || "" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/sync", async (req, res) => {
  try {
    const { syncCalendar } = await import("../services/calendarSync.js");
    const result = await syncCalendar(req.user);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
