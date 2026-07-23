import { Router } from "express";
import { z } from "zod";
import crypto from "crypto";
import Appointment from "../models/Appointment.js";
import BookingToken from "../models/BookingToken.js";
import Availability from "../models/Availability.js";
import Patient from "../models/Patient.js";
import Organization from "../models/Organization.js";
import User from "../models/User.js";
import { protect } from "../middleware/auth.js";
import { sendSms } from "../services/alertService.js";
import { sendEmail } from "../services/emailService.js";
import { getAvailableSlots } from "../utils/slotGenerator.js";
import { notifyForAppointment } from "../services/notificationService.js";

const router = Router();

function generateToken() {
  return crypto.randomBytes(24).toString("hex");
}

function generateTimeSlots(startTime, endTime, slotDuration, buffer, existingAppointments) {
  const slots = [];
  const [startH, startM] = startTime.split(":").map(Number);
  const [endH, endM] = endTime.split(":").map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  const bookedTimes = new Set();
  for (const apt of existingAppointments) {
    const d = new Date(apt.date);
    bookedTimes.add(d.getHours() * 60 + d.getMinutes());
  }

  for (let m = startMinutes; m + slotDuration <= endMinutes; m += slotDuration + buffer) {
    if (!bookedTimes.has(m)) {
      const h = Math.floor(m / 60);
      const min = m % 60;
      const endM2 = m + slotDuration;
      const endH2 = Math.floor(endM2 / 60);
      const endMin2 = endM2 % 60;
      slots.push({
        time: `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`,
        endTime: `${String(endH2).padStart(2, "0")}:${String(endMin2).padStart(2, "0")}`,
        label: `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")} - ${String(endH2).padStart(2, "0")}:${String(endMin2).padStart(2, "0")}`,
      });
    }
  }
  return slots;
}

router.get("/available-slots", async (req, res) => {
  try {
    const { date, organization } = req.query;
    if (!date || !organization) {
      return res.status(400).json({ message: "date and organization are required" });
    }
    const dt = new Date(date + "T00:00:00");
    const dayOfWeek = dt.getDay();

    const availability = await Availability.find({
      organization,
      dayOfWeek,
      isActive: true,
    }).sort({ startTime: 1 });

    if (availability.length === 0) {
      return res.json({ slots: [], message: "No availability for this date" });
    }

    const dayStart = new Date(dt);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dt);
    dayEnd.setHours(23, 59, 59, 999);

    const existingAppointments = await Appointment.find({
      organization,
      date: { $gte: dayStart, $lte: dayEnd },
      status: { $nin: ["cancelled", "no-show"] },
    });

    const allSlots = [];
    for (const avail of availability) {
      const slots = generateTimeSlots(
        avail.startTime,
        avail.endTime,
        avail.slotDuration || 30,
        avail.bufferBetween || 0,
        existingAppointments
      );
      allSlots.push(...slots);
    }

    res.json({ slots: allSlots, date });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/generate-booking-link", protect, async (req, res) => {
  try {
    const { patientId, sendVia } = req.body;
    if (!patientId) return res.status(400).json({ message: "patientId required" });

    const patient = await Patient.findOne({ _id: patientId, organization: req.user.organization });
    if (!patient) return res.status(404).json({ message: "Patient not found" });

    const token = generateToken();
    const bookingToken = await BookingToken.create({
      patient: patient._id,
      organization: req.user.organization,
      token,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    const baseUrl = process.env.CLIENT_URL || `${req.protocol}://${req.get("host")}`;
    const bookingLink = `${baseUrl}/book/${token}`;

    if (sendVia === "sms" && patient.phone) {
      const org = await Organization.findById(req.user.organization);
      await sendSms(patient.phone, `You have a new booking link from ${org?.name || "your clinic"}: ${bookingLink}`);
    } else if (sendVia === "email" && patient.email) {
      await sendEmail({
        to: patient.email,
        subject: "Book Your Appointment",
        html: `<p>Click the link to book your appointment: <a href="${bookingLink}">${bookingLink}</a></p>`,
      });
    }

    res.json({ token, bookingLink, message: "Booking link generated" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/booking-info/:token", async (req, res) => {
  try {
    const bookingToken = await BookingToken.findOne({ token: req.params.token }).populate("patient", "name phone email").populate("organization", "name settings");
    if (!bookingToken) return res.status(404).json({ message: "Invalid or expired booking link" });
    if (bookingToken.usedAt) return res.status(400).json({ message: "This booking link has already been used" });
    if (bookingToken.expiresAt < new Date()) return res.status(400).json({ message: "This booking link has expired" });

    const providers = await User.find({
      organization: bookingToken.organization,
      role: { $in: ["admin", "doctor"] },
      isActive: true,
    }).select("name specialty role");

    res.json({
      patient: { _id: bookingToken.patient._id, name: bookingToken.patient.name },
      organization: { _id: bookingToken.organization._id, name: bookingToken.organization.name },
      token: bookingToken.token,
      providers: providers.map((p) => ({ _id: p._id, name: p.name, specialty: p.specialty })),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/booking-slots/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const { date, provider } = req.query;
    if (!date) return res.status(400).json({ message: "date required" });

    const bookingToken = await BookingToken.findOne({ token });
    if (!bookingToken) return res.status(404).json({ message: "Invalid token" });
    if (bookingToken.usedAt) return res.status(400).json({ message: "Already used" });

    const slots = await getAvailableSlots(bookingToken.organization, date, provider || null);
    res.json({ slots, date });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/book", async (req, res) => {
  try {
    const { token, date, time, provider: providerId } = req.body;
    if (!token || !date || !time) return res.status(400).json({ message: "token, date, and time required" });

    const bookingToken = await BookingToken.findOne({ token });
    if (!bookingToken) return res.status(404).json({ message: "Invalid token" });
    if (bookingToken.usedAt) return res.status(400).json({ message: "Already used" });
    if (bookingToken.expiresAt < new Date()) return res.status(400).json({ message: "Expired" });

    const [hours, minutes] = time.split(":").map(Number);
    const appointmentDate = new Date(date + "T00:00:00");
    appointmentDate.setHours(hours, minutes, 0, 0);

    const slotCheck = await validateSlot2(bookingToken.organization, date, time, 30, providerId || null);
    if (!slotCheck.valid) {
      return res.status(409).json({ message: slotCheck.message, alternatives: slotCheck.alternatives });
    }

    const appointment = await Appointment.create({
      organization: bookingToken.organization,
      patient: bookingToken.patient,
      provider: providerId || null,
      title: "Patient Self-Scheduled",
      date: appointmentDate,
      duration: 30,
      type: "in-person",
      status: "confirmed",
      notes: "Booked via patient portal",
    });

    bookingToken.usedAt = new Date();
    await bookingToken.save();

    const patient = await Patient.findById(bookingToken.patient);
    const org = await Organization.findById(bookingToken.organization);

    if (patient?.phone) {
      await sendSms(patient.phone, `Your appointment has been confirmed for ${date} at ${time} at ${org?.name || "the clinic"}.`);
    }
    if (patient?.email) {
      await sendEmail({
        to: patient.email,
        subject: "Appointment Confirmed",
        html: `<p>Your appointment is confirmed for <strong>${date}</strong> at <strong>${time}</strong>.</p><p>Location: ${org?.name || "Clinic"}</p>`,
      });
    }

    await Appointment.findByIdAndUpdate(appointment._id, { $push: { reminders: { channel: "email", sentAt: new Date(), type: "confirmation" } } });

    const populated = await appointment.populate("patient", "name phone email");
    notifyForAppointment(populated);

    res.status(201).json({ appointment, message: "Appointment booked successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

async function validateSlot2(orgId, date, time, duration, providerId) {
  const { validateSlot } = await import("../utils/slotGenerator.js");
  return validateSlot(orgId, date, time, duration, providerId);
}

router.get("/availability", protect, async (req, res) => {
  try {
    const availability = await Availability.find({ organization: req.user.organization }).sort({ dayOfWeek: 1, startTime: 1 });
    res.json({ availability });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/availability", protect, async (req, res) => {
  try {
    const { slots } = req.body;
    if (!slots || !Array.isArray(slots)) return res.status(400).json({ message: "slots array required" });

    await Availability.deleteMany({ organization: req.user.organization });

    const docs = slots.map((s) => ({
      organization: req.user.organization,
      dayOfWeek: s.dayOfWeek,
      startTime: s.startTime,
      endTime: s.endTime,
      slotDuration: s.slotDuration || 30,
      bufferBetween: s.bufferBetween || 0,
      isActive: s.isActive !== false,
    }));

    const created = await Availability.insertMany(docs);
    res.json({ availability: created, message: "Availability updated" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function computeDayHourDist(calls) {
  const dayCount = [0, 0, 0, 0, 0, 0, 0];
  const hourCount = {};
  for (const c of calls) {
    const d = new Date(c.createdAt);
    dayCount[d.getDay()]++;
    const h = d.getHours();
    hourCount[h] = (hourCount[h] || 0) + 1;
  }
  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dayDist = dayLabels.map((l, i) => ({ label: l, count: dayCount[i] }));
  const peakHour = Object.entries(hourCount).sort((a, b) => b[1] - a[1])[0];
  return { dayDist, peakHour: peakHour ? +peakHour[0] : null, peakHourCount: peakHour ? peakHour[1] : 0 };
}

async function buildReportData(orgId) {
  const Organization = (await import("../models/Organization.js")).default;
  const User = (await import("../models/User.js")).default;
  const Call = (await import("../models/Call.js")).default;
  const Appointment = (await import("../models/Appointment.js")).default;
  const Patient = (await import("../models/Patient.js")).default;
  const Questionnaire = (await import("../models/Questionnaire.js")).default;
  const Report = (await import("../models/Report.js")).default;
  const KnowledgeDoc = (await import("../models/KnowledgeDoc.js")).default;
  const BookingToken = (await import("../models/BookingToken.js")).default;
  const AuditLog = (await import("../models/AuditLog.js")).default;
  const Notification = (await import("../models/Notification.js")).default;
  const org = await Organization.findById(orgId);
  if (!org) return null;
  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const monthName = firstOfMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const prevMonthName = prevMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const match = { organization: orgId };

  // ── CALLS ──
  const calls = await Call.find({ ...match, createdAt: { $gte: firstOfMonth, $lt: nextMonth } }).populate("patient startedBy");
  const prevCalls = await Call.find({ ...match, createdAt: { $gte: prevMonth, $lt: firstOfMonth } });

  const statusCounts = { completed: 0, failed: 0, scheduled: 0, "in-progress": 0, transferred: 0, cancelled: 0 };
  for (const c of calls) { statusCounts[c.status] = (statusCounts[c.status] || 0) + 1; }

  const answeredCalls = calls.filter((c) => c.patientResponded === true).length;
  const emergencyCalls = calls.filter((c) => c.emergencyDetected).length;
  const inboundCalls = calls.filter((c) => c.direction === "inbound").length;
  const outboundCalls = calls.filter((c) => c.direction !== "inbound").length;
  const totalDuration = calls.reduce((s, c) => s + (c.duration || 0), 0);
  const avgDuration = calls.length > 0 ? Math.round(totalDuration / calls.length) : 0;
  const maxDuration = calls.length > 0 ? Math.max(...calls.map((c) => c.duration || 0)) : 0;
  const avgSeverity = calls.length > 0 ? (calls.reduce((s, c) => s + (c.aiSeverityScore || 0), 0) / calls.length).toFixed(1) : "N/A";
  const highSeverityCalls = calls.filter((c) => (c.aiSeverityScore || 0) >= 7).length;

  // Call distribution by day & hour
  const { dayDist, peakHour, peakHourCount } = computeDayHourDist(calls);

  // Provider / staff performance
  const staffCallMap = {};
  for (const c of calls) {
    if (c.startedBy) {
      const name = c.startedBy.name || "Unknown";
      if (!staffCallMap[name]) staffCallMap[name] = { calls: 0, completed: 0, duration: 0 };
      staffCallMap[name].calls++;
      if (c.status === "completed") staffCallMap[name].completed++;
      staffCallMap[name].duration += c.duration || 0;
    }
  }
  const staffPerformance = Object.entries(staffCallMap)
    .map(([name, d]) => ({ name, ...d }))
    .sort((a, b) => b.calls - a.calls)
    .slice(0, 5);

  // Top patients
  const patientCallMap = {};
  for (const c of calls) {
    if (c.patient) {
      const name = c.patient.name || c.patient.phone || "Unknown";
      if (!patientCallMap[name]) patientCallMap[name] = { calls: 0, emergencies: 0 };
      patientCallMap[name].calls++;
      if (c.emergencyDetected) patientCallMap[name].emergencies++;
    }
  }
  const topPatients = Object.entries(patientCallMap)
    .map(([name, d]) => ({ name, ...d }))
    .sort((a, b) => b.calls - a.calls)
    .slice(0, 5);

  // Triage distribution
  const triageCounts = { 1: 0, 2: 0, 3: 0 };
  for (const c of calls) {
    const t = c.triageTier || 3;
    triageCounts[t] = (triageCounts[t] || 0) + 1;
  }

  // Language distribution
  const langMap = {};
  for (const c of calls) {
    const l = c.language || "en";
    langMap[l] = (langMap[l] || 0) + 1;
  }
  const langDist = Object.entries(langMap).sort((a, b) => b[1] - a[1]);

  // Recall analysis
  const recalls = calls.reduce((s, c) => s + (c.recallCount || 0), 0);

  // ── QA SCORES ──
  const scoredCalls = calls.filter((c) => c.qaScore?.overall);
  const avgQAOverall = scoredCalls.length > 0 ? Math.round(scoredCalls.reduce((s, c) => s + (c.qaScore.overall || 0), 0) / scoredCalls.length) : 0;
  const avgQAAccuracy = scoredCalls.length > 0 ? Math.round(scoredCalls.reduce((s, c) => s + (c.qaScore.accuracy || 0), 0) / scoredCalls.length) : 0;
  const avgQAEmpathy = scoredCalls.length > 0 ? Math.round(scoredCalls.reduce((s, c) => s + (c.qaScore.empathy || 0), 0) / scoredCalls.length) : 0;
  const avgQAProfessionalism = scoredCalls.length > 0 ? Math.round(scoredCalls.reduce((s, c) => s + (c.qaScore.professionalism || 0), 0) / scoredCalls.length) : 0;
  const avgQAResolution = scoredCalls.length > 0 ? Math.round(scoredCalls.reduce((s, c) => s + (c.qaScore.resolution || 0), 0) / scoredCalls.length) : 0;

  // ── APPOINTMENTS ──
  const appointments = await Appointment.find({ ...match, date: { $gte: firstOfMonth, $lt: nextMonth } });
  const prevAppointments = await Appointment.find({ ...match, date: { $gte: prevMonth, $lt: firstOfMonth } });
  const totalAppointments = appointments.length;
  const completedAppts = appointments.filter((a) => a.status === "completed").length;
  const noShows = appointments.filter((a) => a.status === "no-show").length;
  const cancellations = appointments.filter((a) => a.status === "cancelled").length;
  const prevNoShows = prevAppointments.filter((a) => a.status === "no-show").length;

  // Appointment type distribution
  const typeCounts = { "in-person": 0, phone: 0, video: 0 };
  for (const a of appointments) { typeCounts[a.type] = (typeCounts[a.type] || 0) + 1; }

  // Appointment reasons
  const reasonMap = {};
  for (const a of appointments) {
    const r = a.reason || a.title || "Other";
    reasonMap[r] = (reasonMap[r] || 0) + 1;
  }
  const topReasons = Object.entries(reasonMap).sort((a, b) => b[1] - a[1]).slice(0, 5);

  // ── PATIENTS ──
  const patientCount = await Patient.countDocuments(match);
  const newPatients = await Patient.countDocuments({ ...match, createdAt: { $gte: firstOfMonth } });

  // ── USERS / STAFF ──
  const userCount = await User.countDocuments({ ...match, isActive: true });
  const adminCount = await User.countDocuments({ ...match, role: "admin", isActive: true });
  const staffCount = await User.countDocuments({ ...match, role: { $ne: "admin" }, isActive: true });

  // ── RESOURCES ──
  const questionnaireCount = await Questionnaire.countDocuments({ ...match, isActive: true });
  const defaultTemplates = await Questionnaire.countDocuments({ ...match, isActive: true, isDefault: true });
  const reportsGenerated = await Report.countDocuments({ ...match, createdAt: { $gte: firstOfMonth } });
  const docCount = await KnowledgeDoc.countDocuments(match);

  // ── ACTIVITY ──
  const portalBookings = await BookingToken.countDocuments({ ...match, usedAt: { $gte: firstOfMonth }, used: true });
  const auditLogCount = await AuditLog.countDocuments({ ...match, createdAt: { $gte: firstOfMonth } });
  const notificationsSent = await Notification.countDocuments({ ...match, createdAt: { $gte: firstOfMonth } });

  // ── DERIVED ──
  const completionRate = calls.length > 0 ? Math.round(statusCounts.completed / calls.length * 100) : 0;
  const answerRate = calls.length > 0 ? Math.round(answeredCalls / calls.length * 100) : 0;
  const noShowRate = totalAppointments > 0 ? Math.round(noShows / totalAppointments * 100) : 0;
  const prevNoShowRate = prevAppointments.length > 0 ? Math.round(prevNoShows / prevAppointments.length * 100) : 0;
  const noShowSavings = (prevNoShows - noShows) * 150;
  const prevCallCount = prevCalls.length;
  const callGrowth = prevCallCount > 0 ? Math.round((calls.length - prevCallCount) / prevCallCount * 100) : 0;
  const prevCompletedCount = prevCalls.filter((c) => c.status === "completed").length;
  const completionGrowth = prevCompletedCount > 0 ? Math.round((statusCounts.completed - prevCompletedCount) / prevCompletedCount * 100) : 0;
  const voiceMinutes = Math.round(totalDuration / 60);
  const scheduleFillRate = totalAppointments > 0 ? Math.round(completedAppts / totalAppointments * 100) : 0;

  const maxDayCount = Math.max(...dayDist.map((d) => d.count), 1);

  // ── BUILD DATA OBJECT ──
  const data = {
    orgName: org.name,
    monthName, prevMonthName,
    // Calls
    totalCalls: calls.length, ...statusCounts,
    answeredCalls, emergencyCalls, inboundCalls, outboundCalls,
    avgDuration, maxDuration, totalDuration, voiceMinutes,
    avgSeverity, highSeverityCalls,
    prevCallCount, callGrowth, completionGrowth,
    // Call distribution
    dayDist, peakHour, peakHourCount, maxDayCount,
    staffPerformance, topPatients,
    triageCounts, langDist, recalls,
    // QA
    avgQAOverall, avgQAAccuracy, avgQAEmpathy, avgQAProfessionalism, avgQAResolution, scoredCalls: scoredCalls.length,
    // Appointments
    totalAppointments, completedAppts, noShows, cancellations,
    noShowRate, prevNoShowRate, noShowSavings, scheduleFillRate,
    typeCounts, topReasons,
    // Patients
    patientCount, newPatients,
    // Staff
    userCount, adminCount, staffCount,
    // Resources
    questionnaireCount, defaultTemplates, reportsGenerated, docCount,
    // Activity
    portalBookings, auditLogCount, notificationsSent,
    generatedAt: now.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
  };

  const s = (v) => v ?? 0;
  const dayRow = data.dayDist.map((d) => `<div style="flex:1;text-align:center;"><div style="font-size:10px;color:#94a3b8;margin-bottom:2px;">${d.label}</div><div style="height:48px;background:#f1f5f9;border-radius:4px;position:relative;overflow:hidden;"><div style="position:absolute;bottom:0;left:0;right:0;height:${Math.round(d.count / data.maxDayCount * 100)}%;background:linear-gradient(180deg,#3b82f6,#2563eb);border-radius:4px;"></div></div><div style="font-size:13px;font-weight:700;margin-top:3px;">${d.count}</div></div>`).join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${data.orgName} — ${data.monthName} Report</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#111827;line-height:1.6;background:#f0f2f5;-webkit-font-smoothing:antialiased}
  .page{max-width:860px;margin:0 auto;padding:28px 20px}

  /* ── HERO HEADER ── */
  .hero{background:linear-gradient(135deg,#0c1222 0%,#162032 40%,#1a2a44 100%);border-radius:20px;padding:44px 40px 36px;margin-bottom:28px;color:#fff;position:relative;overflow:hidden}
  .hero::before{content:'';position:absolute;top:-80px;right:-60px;width:340px;height:340px;background:radial-gradient(circle,rgba(59,130,246,0.12) 0%,transparent 70%);pointer-events:none}
  .hero::after{content:'';position:absolute;bottom:-60px;left:40%;width:260px;height:260px;background:radial-gradient(circle,rgba(139,92,246,0.08) 0%,transparent 70%);pointer-events:none}
  .hero-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;position:relative}
  .hero-brand{font-size:12px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,0.45)}
  .hero-date{font-size:12px;color:rgba(255,255,255,0.35);background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.08);padding:5px 14px;border-radius:20px}
  .hero h1{font-size:30px;font-weight:800;letter-spacing:-0.8px;line-height:1.2;position:relative;margin-bottom:6px}
  .hero .hero-sub{font-size:16px;color:rgba(255,255,255,0.55);font-weight:400;position:relative}
  .hero .hero-sub strong{color:rgba(255,255,255,0.85);font-weight:600}
  .hero-kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:28px;position:relative}
  .hero-kpi{background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.07);border-radius:14px;padding:18px 14px;text-align:center;backdrop-filter:blur(10px)}
  .hero-kpi .hkv{font-size:30px;font-weight:800;letter-spacing:-1px;line-height:1}
  .hero-kpi .hkl{font-size:10px;text-transform:uppercase;letter-spacing:1px;color:rgba(255,255,255,0.4);font-weight:600;margin-top:6px}
  .hero-kpi .hks{font-size:11px;color:rgba(255,255,255,0.3);margin-top:2px}
  .c-blue{color:#60a5fa}.c-green{color:#34d399}.c-purple{color:#a78bfa}.c-amber{color:#fbbf24}.c-red{color:#f87171}.c-white{color:#fff}

  /* ── SECTION CARDS ── */
  .card{background:#fff;border:1px solid #e5e7eb;border-radius:16px;padding:28px;margin-bottom:20px;box-shadow:0 1px 3px rgba(0,0,0,0.04)}
  .card-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:20px}
  .card-title{font-size:16px;font-weight:700;color:#111827;display:flex;align-items:center;gap:10px}
  .card-title .icon{width:32px;height:32px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:15px;flex-shrink:0}
  .card-title .icon.blue{background:#eff6ff;color:#2563eb}
  .card-title .icon.green{background:#ecfdf5;color:#059669}
  .card-title .icon.purple{background:#f5f3ff;color:#7c3aed}
  .card-title .icon.amber{background:#fffbeb;color:#d97706}
  .card-title .icon.red{background:#fef2f2;color:#dc2626}
  .card-title .icon.slate{background:#f8fafc;color:#475569}
  .badge{font-size:11px;font-weight:600;padding:3px 10px;border-radius:8px;display:inline-flex;align-items:center;gap:4px}
  .badge.blue{background:#eff6ff;color:#1d4ed8}.badge.green{background:#ecfdf5;color:#047857}.badge.purple{background:#f5f3ff;color:#5b21b6}.badge.amber{background:#fffbeb;color:#92400e}.badge.red{background:#fef2f2;color:#991b1b}.badge.slate{background:#f8fafc;color:#475569}

  /* ── STAT ROWS ── */
  .stat-row{display:flex;justify-content:space-between;align-items:center;padding:11px 0;border-bottom:1px solid #f3f4f6;font-size:13px}
  .stat-row:last-child{border-bottom:none}
  .stat-label{color:#6b7280;font-weight:500}
  .stat-value{font-weight:700;color:#111827}

  /* ── MINI KPI GRID ── */
  .kpi-grid{display:grid;gap:12px}
  .kpi-grid.c2{grid-template-columns:1fr 1fr}.kpi-grid.c3{grid-template-columns:1fr 1fr 1fr}.kpi-grid.c4{grid-template-columns:1fr 1fr 1fr 1fr}
  .mini-kpi{background:#f9fafb;border:1px solid #f3f4f6;border-radius:12px;padding:16px 12px;text-align:center}
  .mini-kpi .mkv{font-size:26px;font-weight:800;letter-spacing:-0.5px;line-height:1}
  .mini-kpi .mkl{font-size:10px;text-transform:uppercase;letter-spacing:0.8px;color:#9ca3af;font-weight:600;margin-top:5px}
  .mini-kpi .mks{font-size:11px;color:#d1d5db;margin-top:2px}

  /* ── PROGRESS BARS ── */
  .progress-wrap{margin-bottom:14px}.progress-wrap:last-child{margin-bottom:0}
  .progress-head{display:flex;justify-content:space-between;font-size:12px;margin-bottom:5px;color:#6b7280}
  .progress-head span:last-child{font-weight:700;color:#374151}
  .progress-track{height:8px;background:#f3f4f6;border-radius:6px;overflow:hidden}
  .progress-fill{height:100%;border-radius:6px;transition:width .3s}
  .pf-blue{background:linear-gradient(90deg,#2563eb,#3b82f6)}.pf-green{background:linear-gradient(90deg,#059669,#34d399)}.pf-amber{background:linear-gradient(90deg,#d97706,#fbbf24)}.pf-red{background:linear-gradient(90deg,#dc2626,#f87171)}.pf-purple{background:linear-gradient(90deg,#7c3aed,#a78bfa)}

  /* ── BAR CHART (days) ── */
  .bar-chart{display:flex;gap:6px;align-items:flex-end;height:120px;padding:0 4px}
  .bar-col{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%}
  .bar-track{width:100%;background:#f3f4f6;border-radius:6px;position:relative;overflow:hidden;min-height:4px}
  .bar-fill{position:absolute;bottom:0;left:0;right:0;border-radius:6px;background:linear-gradient(180deg,#3b82f6,#2563eb)}
  .bar-label{font-size:10px;color:#9ca3af;margin-bottom:4px;font-weight:500}
  .bar-value{font-size:12px;font-weight:700;color:#374151;margin-top:6px}

  /* ── STAFF CARDS ── */
  .staff-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
  .staff-card{background:#f9fafb;border:1px solid #f3f4f6;border-radius:12px;padding:14px 16px;display:flex;align-items:center;justify-content:space-between}
  .staff-name{font-size:13px;font-weight:600;color:#111827}.staff-meta{font-size:11px;color:#9ca3af;margin-top:1px}
  .staff-pct{font-size:22px;font-weight:800;letter-spacing:-0.5px}

  /* ── ROI BOX ── */
  .roi-box{background:linear-gradient(135deg,#ecfdf5 0%,#d1fae5 50%,#a7f3d0 100%);border:1px solid #6ee7b7;border-radius:16px;padding:28px;text-align:center;margin-bottom:20px}
  .roi-val{font-size:46px;font-weight:900;color:#047857;letter-spacing:-1.5px;line-height:1}
  .roi-label{font-size:14px;font-weight:600;color:#059669;margin-top:4px}
  .roi-sub{font-size:12px;color:#6ee7b7;margin-top:6px}

  /* ── LANGUAGE PILLS ── */
  .lang-pills{display:flex;flex-wrap:wrap;gap:8px}
  .lang-pill{background:#f3f4f6;border:1px solid #e5e7eb;border-radius:10px;padding:6px 14px;font-size:12px;font-weight:600;color:#374151;display:flex;align-items:center;gap:6px}
  .lang-pill .lc{font-size:10px;color:#9ca3af;font-weight:500}

  /* ── FOOTER ── */
  .footer{margin-top:28px;padding:24px 0 8px;border-top:1px solid #e5e7eb;text-align:center}
  .footer-brand{font-size:16px;font-weight:800;color:#111827;letter-spacing:-0.3px}
  .footer-brand span{color:#2563eb}
  .footer p{font-size:11px;color:#9ca3af;margin-top:4px}
  .footer-line{width:40px;height:3px;background:linear-gradient(90deg,#2563eb,#7c3aed);border-radius:3px;margin:12px auto 0}

  @media print{.page{padding:0}.card{box-shadow:none;break-inside:avoid}}
  @media(max-width:640px){.hero-kpis,.kpi-grid.c4{grid-template-columns:1fr 1fr}.staff-grid{grid-template-columns:1fr}.hero{padding:28px 20px 24px}.hero h1{font-size:22px}}
</style>
</head>
<body>
<div class="page">

  <!-- HERO -->
  <div class="hero">
    <div class="hero-top">
      <div class="hero-brand">Oriveo</div>
      <div class="hero-date">${data.generatedAt}</div>
    </div>
    <h1>Monthly Performance Report</h1>
    <div class="hero-sub"><strong>${data.orgName}</strong> &bull; ${data.monthName}</div>
    <div class="hero-kpis">
      <div class="hero-kpi"><div class="hkv c-blue">${s(data.totalCalls)}</div><div class="hkl">Total Calls</div><div class="hks">${s(data.callGrowth) >= 0 ? '+' : ''}${s(data.callGrowth)}% vs prev</div></div>
      <div class="hero-kpi"><div class="hkv c-green">${s(data.answerRate)}%</div><div class="hkl">Answer Rate</div><div class="hks">${s(data.answeredCalls)} answered</div></div>
      <div class="hero-kpi"><div class="hkv c-purple">${s(data.avgQAOverall) || '—'}</div><div class="hkl">QA Score</div><div class="hks">${s(data.scoredCalls)} scored</div></div>
      <div class="hero-kpi"><div class="hkv c-white">${s(data.voiceMinutes)}</div><div class="hkl">Voice Min</div><div class="hks">${s(data.avgDuration)}s avg</div></div>
    </div>
  </div>

  <!-- SAVINGS -->
  <div class="roi-box">
    <div class="roi-val">${s(data.noShowSavings) >= 0 ? '$' + s(data.noShowSavings).toLocaleString() : '$0'}</div>
    <div class="roi-label">Estimated Cost Savings This Month</div>
    <div class="roi-sub">No-show reduction vs ${data.prevMonthName} &bull; $150 avg/missed &bull; ${s(data.prevNoShowRate)}% → ${s(data.noShowRate)}%</div>
  </div>

  <!-- CALL VOLUME BY DAY -->
  <div class="card">
    <div class="card-header">
      <div class="card-title"><span class="icon blue">📊</span> Call Volume by Day</div>
      ${s(data.peakHour) !== null ? `<span class="badge blue">Peak: ${s(data.peakHour).toString().padStart(2,'0')}:00</span>` : ''}
    </div>
    <div class="bar-chart">
      ${data.dayDist.map((d) => `<div class="bar-col"><div class="bar-label">${d.label}</div><div class="bar-track" style="height:100%"><div class="bar-fill" style="height:${Math.round(d.count / data.maxDayCount * 100)}%"></div></div><div class="bar-value">${d.count}</div></div>`).join("")}
    </div>
  </div>

  <!-- CALL OPERATIONS -->
  <div class="card">
    <div class="card-header">
      <div class="card-title"><span class="icon green">📞</span> Call Operations</div>
      <span class="badge green">${s(data.totalCalls)} total</span>
    </div>
    <div class="kpi-grid c2">
      <div>
        <div class="stat-row"><span class="stat-label">Completed</span><span class="stat-value" style="color:#059669">${s(data.completed)} (${s(data.completionRate)}%)</span></div>
        <div class="stat-row"><span class="stat-label">Failed</span><span class="stat-value" style="color:#dc2626">${s(data.failed)}</span></div>
        <div class="stat-row"><span class="stat-label">In Progress</span><span class="stat-value" style="color:#2563eb">${s(data["in-progress"])}</span></div>
        <div class="stat-row"><span class="stat-label">Scheduled</span><span class="stat-value" style="color:#d97706">${s(data.scheduled)}</span></div>
        <div class="stat-row"><span class="stat-label">Transferred / Cancelled</span><span class="stat-value">${s(data.transferred)} / ${s(data.cancelled)}</span></div>
      </div>
      <div>
        <div class="stat-row"><span class="stat-label">Outbound / Inbound</span><span class="stat-value">${s(data.outboundCalls)} / ${s(data.inboundCalls)}</span></div>
        <div class="stat-row"><span class="stat-label">Emergencies Detected</span><span class="stat-value"><span class="badge red">${s(data.emergencyCalls)}</span></span></div>
        <div class="stat-row"><span class="stat-label">High Severity (7+)</span><span class="stat-value" style="color:#dc2626">${s(data.highSeverityCalls)}</span></div>
        <div class="stat-row"><span class="stat-label">Avg AI Severity</span><span class="stat-value">${data.avgSeverity}/10</span></div>
        <div class="stat-row"><span class="stat-label">Recalls (total)</span><span class="stat-value">${s(data.recalls)}</span></div>
      </div>
    </div>
    <div style="margin-top:18px">
      <div class="progress-wrap">
        <div class="progress-head"><span>Completion Rate</span><span>${s(data.completionRate)}% ${s(data.completionGrowth) >= 0 ? '↑' : '↓'} ${Math.abs(s(data.completionGrowth))}%</span></div>
        <div class="progress-track"><div class="progress-fill pf-blue" style="width:${s(data.completionRate)}%"></div></div>
      </div>
      <div class="progress-wrap">
        <div class="progress-head"><span>Answer Rate</span><span>${s(data.answerRate)}%</span></div>
        <div class="progress-track"><div class="progress-fill pf-green" style="width:${s(data.answerRate)}%"></div></div>
      </div>
    </div>
  </div>

  <!-- TRIAGE -->
  <div class="card">
    <div class="card-header">
      <div class="card-title"><span class="icon ${s(data.highSeverityCalls) > 0 ? 'red' : 'green'}">⚡</span> Triage &amp; Severity</div>
      <span class="badge ${s(data.highSeverityCalls) > 0 ? 'red' : 'green'}">${s(data.highSeverityCalls)} high-priority</span>
    </div>
    <div class="kpi-grid c3">
      <div class="mini-kpi"><div class="mkv" style="color:#059669">${s(data.triageCounts[1])}</div><div class="mkl">Tier 1 · Urgent</div><div class="mks">Immediate attention</div></div>
      <div class="mini-kpi"><div class="mkv" style="color:#d97706">${s(data.triageCounts[2])}</div><div class="mkl">Tier 2 · Moderate</div><div class="mks">Needs follow-up</div></div>
      <div class="mini-kpi"><div class="mkv" style="color:#2563eb">${s(data.triageCounts[3])}</div><div class="mkl">Tier 3 · Routine</div><div class="mks">Standard calls</div></div>
    </div>
  </div>

  <!-- STAFF PERFORMANCE -->
  ${s(data.staffPerformance.length) > 0 ? `
  <div class="card">
    <div class="card-header">
      <div class="card-title"><span class="icon purple">👥</span> Staff Performance</div>
      <span class="badge purple">${s(data.staffPerformance.length)} active</span>
    </div>
    <div class="staff-grid">
      ${data.staffPerformance.map((sp) => `<div class="staff-card"><div><div class="staff-name">${sp.name}</div><div class="staff-meta">${sp.calls} calls · ${sp.completed} completed</div></div><div class="staff-pct" style="color:#2563eb">${sp.calls > 0 ? Math.round(sp.completed / sp.calls * 100) : 0}%</div></div>`).join("")}
    </div>
  </div>
  ` : ""}

  <!-- TOP PATIENTS -->
  ${s(data.topPatients.length) > 0 ? `
  <div class="card">
    <div class="card-header">
      <div class="card-title"><span class="icon amber">🩺</span> Most Engaged Patients</div>
    </div>
    ${data.topPatients.map((tp) => `<div class="stat-row"><span class="stat-label">${tp.name}</span><span class="stat-value">${tp.calls} calls ${s(tp.emergencies) > 0 ? '<span class="badge red" style="margin-left:8px">'+tp.emergencies+' emerg.</span>' : ''}</span></div>`).join("")}
  </div>
  ` : ""}

  <!-- QA -->
  <div class="card">
    <div class="card-header">
      <div class="card-title"><span class="icon purple">🎯</span> Quality Assurance</div>
      <span class="badge purple">${s(data.scoredCalls)} scored</span>
    </div>
    <div class="kpi-grid c4">
      <div class="mini-kpi"><div class="mkv" style="color:#7c3aed">${s(data.avgQAOverall)}</div><div class="mkl">Overall</div></div>
      <div class="mini-kpi"><div class="mkv" style="color:#2563eb">${s(data.avgQAAccuracy)}</div><div class="mkl">Accuracy</div></div>
      <div class="mini-kpi"><div class="mkv" style="color:#059669">${s(data.avgQAEmpathy)}</div><div class="mkl">Empathy</div></div>
      <div class="mini-kpi"><div class="mkv" style="color:#d97706">${s(data.avgQAProfessionalism)}</div><div class="mkl">Professionalism</div></div>
    </div>
    <div style="margin-top:18px">
      <div class="progress-wrap"><div class="progress-head"><span>Accuracy</span><span>${s(data.avgQAAccuracy)}%</span></div><div class="progress-track"><div class="progress-fill pf-blue" style="width:${s(data.avgQAAccuracy)}%"></div></div></div>
      <div class="progress-wrap"><div class="progress-head"><span>Empathy</span><span>${s(data.avgQAEmpathy)}%</span></div><div class="progress-track"><div class="progress-fill pf-green" style="width:${s(data.avgQAEmpathy)}%"></div></div></div>
      <div class="progress-wrap"><div class="progress-head"><span>Professionalism</span><span>${s(data.avgQAProfessionalism)}%</span></div><div class="progress-track"><div class="progress-fill pf-amber" style="width:${s(data.avgQAProfessionalism)}%"></div></div></div>
      <div class="progress-wrap"><div class="progress-head"><span>Resolution</span><span>${s(data.avgQAResolution)}%</span></div><div class="progress-track"><div class="progress-fill pf-purple" style="width:${s(data.avgQAResolution)}%"></div></div></div>
    </div>
  </div>

  <!-- APPOINTMENTS -->
  <div class="card">
    <div class="card-header">
      <div class="card-title"><span class="icon blue">📅</span> Appointments</div>
      <span class="badge blue">${s(data.totalAppointments)} total</span>
    </div>
    <div class="kpi-grid c2">
      <div>
        <div class="stat-row"><span class="stat-label">Completed</span><span class="stat-value" style="color:#059669">${s(data.completedAppts)} (${s(data.scheduleFillRate)}%)</span></div>
        <div class="stat-row"><span class="stat-label">No-Shows</span><span class="stat-value" style="color:#dc2626">${s(data.noShows)} (${s(data.noShowRate)}%)</span></div>
        <div class="stat-row"><span class="stat-label">Cancelled</span><span class="stat-value" style="color:#d97706">${s(data.cancellations)}</span></div>
      </div>
      <div>
        <div class="stat-row"><span class="stat-label">In-Person</span><span class="stat-value">${s(data.typeCounts["in-person"])}</span></div>
        <div class="stat-row"><span class="stat-label">Phone</span><span class="stat-value">${s(data.typeCounts["phone"])}</span></div>
        <div class="stat-row"><span class="stat-label">Video</span><span class="stat-value">${s(data.typeCounts["video"])}</span></div>
      </div>
    </div>
    <div style="margin-top:16px">
      <div class="progress-wrap"><div class="progress-head"><span>Last Month No-Show</span><span>${s(data.prevNoShowRate)}%</span></div><div class="progress-track"><div class="progress-fill pf-amber" style="width:${s(data.prevNoShowRate)}%"></div></div></div>
      <div class="progress-wrap"><div class="progress-head"><span>This Month No-Show</span><span>${s(data.noShowRate)}%</span></div><div class="progress-track"><div class="progress-fill ${s(data.noShowRate) <= s(data.prevNoShowRate) ? 'pf-green' : 'pf-red'}" style="width:${s(data.noShowRate)}%"></div></div></div>
    </div>
    ${s(data.topReasons.length) > 0 ? `
    <div style="margin-top:18px">
      <div style="font-size:13px;font-weight:700;color:#374151;margin-bottom:8px">Top Reasons</div>
      ${data.topReasons.map(([reason, count]) => `<div class="stat-row"><span class="stat-label">${reason}</span><span class="stat-value">${count}</span></div>`).join("")}
    </div>
    ` : ""}
  </div>

  <!-- PATIENTS & STAFF -->
  <div class="card">
    <div class="card-header">
      <div class="card-title"><span class="icon green">🏥</span> Patients &amp; Staff</div>
    </div>
    <div class="kpi-grid c3">
      <div class="mini-kpi"><div class="mkv" style="color:#2563eb">${s(data.patientCount)}</div><div class="mkl">Active Patients</div><div class="mks">${s(data.newPatients)} new</div></div>
      <div class="mini-kpi"><div class="mkv" style="color:#059669">${s(data.userCount)}</div><div class="mkl">Active Staff</div><div class="mks">${s(data.adminCount)} admin · ${s(data.staffCount)} staff</div></div>
      <div class="mini-kpi"><div class="mkv" style="color:#7c3aed">${s(data.portalBookings)}</div><div class="mkl">Portal Bookings</div><div class="mks">Self-scheduled</div></div>
    </div>
  </div>

  <!-- LANGUAGES -->
  ${s(data.langDist.length) > 1 ? `
  <div class="card">
    <div class="card-header">
      <div class="card-title"><span class="icon slate">🌐</span> Languages Used</div>
    </div>
    <div class="lang-pills">
      ${data.langDist.map(([lang, count]) => `<div class="lang-pill">${lang.toUpperCase()} <span class="lc">${count} calls</span></div>`).join("")}
    </div>
  </div>
  ` : ""}

  <!-- RESOURCES & ACTIVITY -->
  <div class="card">
    <div class="card-header">
      <div class="card-title"><span class="icon slate">⚙️</span> Resources &amp; Activity</div>
    </div>
    <div class="kpi-grid c4">
      <div class="mini-kpi"><div class="mkv">${s(data.questionnaireCount)}</div><div class="mkl">Templates</div><div class="mks">${s(data.defaultTemplates)} default</div></div>
      <div class="mini-kpi"><div class="mkv">${s(data.docCount)}</div><div class="mkl">Knowledge Docs</div><div class="mks">References</div></div>
      <div class="mini-kpi"><div class="mkv">${s(data.reportsGenerated)}</div><div class="mkl">Reports</div><div class="mks">Generated</div></div>
      <div class="mini-kpi"><div class="mkv">${s(data.notificationsSent)}</div><div class="mkl">Notifications</div><div class="mks">Sent</div></div>
    </div>
    <div style="margin-top:14px">
      <div class="stat-row"><span class="stat-label">Audit Log Entries</span><span class="stat-value">${s(data.auditLogCount)}</span></div>
      <div class="stat-row"><span class="stat-label">Total Voice Duration</span><span class="stat-value">${s(data.voiceMinutes)} min</span></div>
    </div>
  </div>

  <!-- FOOTER -->
  <div class="footer">
    <div class="footer-brand">Oriveo <span>Healthcare Platform</span></div>
    <p>Automatically generated on ${data.generatedAt} &bull; Confidential</p>
    <p>Questions? Contact support@oriveo.io</p>
    <div class="footer-line"></div>
  </div>

</div>
</body>
</html>`;
  return { data, html };
}

router.post("/generate-monthly-report", protect, async (req, res) => {
  try {
    const report = await buildReportData(req.user.organization);
    if (!report) return res.status(404).json({ message: "Organization not found" });
    res.json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/send-monthly-report", protect, async (req, res) => {
  try {
    const { html, subject } = req.body;
    if (!html) return res.status(400).json({ message: "HTML content is required" });
    const orgId = req.user.organization;
    const User = (await import("../models/User.js")).default;
    const owner = await User.findOne({ organization: orgId, role: "admin" });
    if (!owner?.email) return res.status(400).json({ message: "No admin email found" });
    const { sendEmail } = await import("../services/emailService.js");
    await sendEmail({ to: owner.email, subject: subject || "Monthly Report", html });
    res.json({ message: "Report sent to " + owner.email });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
