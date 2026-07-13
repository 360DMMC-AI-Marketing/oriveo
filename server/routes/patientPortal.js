import { Router } from "express";
import { z } from "zod";
import crypto from "crypto";
import Appointment from "../models/Appointment.js";
import BookingToken from "../models/BookingToken.js";
import Availability from "../models/Availability.js";
import Patient from "../models/Patient.js";
import Organization from "../models/Organization.js";
import { protect } from "../middleware/auth.js";
import { sendSms } from "../services/alertService.js";
import { sendEmail } from "../services/emailService.js";

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

    res.json({
      patient: { _id: bookingToken.patient._id, name: bookingToken.patient.name },
      organization: { _id: bookingToken.organization._id, name: bookingToken.organization.name },
      token: bookingToken.token,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/booking-slots/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const { date } = req.query;
    if (!date) return res.status(400).json({ message: "date required" });

    const bookingToken = await BookingToken.findOne({ token });
    if (!bookingToken) return res.status(404).json({ message: "Invalid token" });
    if (bookingToken.usedAt) return res.status(400).json({ message: "Already used" });

    const dt = new Date(date + "T00:00:00");
    const dayOfWeek = dt.getDay();

    const availability = await Availability.find({
      organization: bookingToken.organization,
      dayOfWeek,
      isActive: true,
    }).sort({ startTime: 1 });

    if (availability.length === 0) {
      return res.json({ slots: [] });
    }

    const dayStart = new Date(dt);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dt);
    dayEnd.setHours(23, 59, 59, 999);

    const existingAppts = await Appointment.find({
      organization: bookingToken.organization,
      date: { $gte: dayStart, $lte: dayEnd },
      status: { $nin: ["cancelled", "no-show"] },
    });

    const allSlots = [];
    for (const avail of availability) {
      allSlots.push(...generateTimeSlots(avail.startTime, avail.endTime, avail.slotDuration || 30, avail.bufferBetween || 0, existingAppts));
    }

    res.json({ slots: allSlots, date });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/book", async (req, res) => {
  try {
    const { token, date, time } = req.body;
    if (!token || !date || !time) return res.status(400).json({ message: "token, date, and time required" });

    const bookingToken = await BookingToken.findOne({ token });
    if (!bookingToken) return res.status(404).json({ message: "Invalid token" });
    if (bookingToken.usedAt) return res.status(400).json({ message: "Already used" });
    if (bookingToken.expiresAt < new Date()) return res.status(400).json({ message: "Expired" });

    const [hours, minutes] = time.split(":").map(Number);
    const appointmentDate = new Date(date + "T00:00:00");
    appointmentDate.setHours(hours, minutes, 0, 0);

    const existing = await Appointment.findOne({
      organization: bookingToken.organization,
      date: appointmentDate,
      status: { $nin: ["cancelled", "no-show"] },
    });
    if (existing) return res.status(409).json({ message: "This time slot is no longer available" });

    const appointment = await Appointment.create({
      organization: bookingToken.organization,
      patient: bookingToken.patient,
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

    res.status(201).json({ appointment, message: "Appointment booked successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

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
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif; color: #1e293b; line-height: 1.5; background: #f8fafc; }
  .page { max-width: 820px; margin: 0 auto; padding: 32px 24px; }
  .header { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); border-radius: 16px; padding: 36px 32px; margin-bottom: 24px; color: #fff; position: relative; overflow: hidden; }
  .header::after { content: ''; position: absolute; top: -50%; right: -20%; width: 300px; height: 300px; background: radial-gradient(circle, rgba(37,99,235,0.15) 0%, transparent 70%); border-radius: 50%; }
  .header h1 { font-size: 28px; font-weight: 700; letter-spacing: -0.5px; position: relative; }
  .header .sub { color: #94a3b8; font-size: 14px; margin-top: 4px; position: relative; }
  .header .badge { display: inline-block; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.08); padding: 4px 14px; border-radius: 20px; font-size: 11px; color: #94a3b8; margin-top: 12px; position: relative; }
  .section { background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 22px 24px; margin-bottom: 18px; }
  .section-title { font-size: 15px; font-weight: 700; margin-bottom: 14px; display: flex; align-items: center; gap: 8px; color: #0f172a; }
  .section-title .ct { background: #2563eb; color: #fff; font-size: 11px; padding: 2px 10px; border-radius: 10px; font-weight: 600; }
  .section-title .ct.green { background: #059669; }
  .section-title .ct.amber { background: #d97706; }
  .section-title .ct.purple { background: #7c3aed; }
  .section-title .ct.red { background: #dc2626; }
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
  .grid-4 { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 12px; }
  .kpi { text-align: center; padding: 16px 8px; background: #f8fafc; border-radius: 10px; }
  .kpi .kv { font-size: 28px; font-weight: 800; letter-spacing: -0.5px; line-height: 1.1; }
  .kpi .kl { font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; font-weight: 600; margin-top: 4px; }
  .kpi .ks { font-size: 11px; color: #94a3b8; margin-top: 2px; }
  .primary { color: #2563eb; } .green { color: #059669; } .red { color: #dc2626; } .amber { color: #d97706; } .purple { color: #7c3aed; }
  .sr { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
  .sr:last-child { border-bottom: none; }
  .sr .sl { color: #475569; } .sr .sv { font-weight: 600; }
  .bg { margin-bottom: 8px; }
  .bl { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 2px; color: #475569; }
  .br { height: 7px; background: #e2e8f0; border-radius: 4px; overflow: hidden; }
  .bf { height: 100%; border-radius: 4px; background: linear-gradient(90deg, #2563eb, #3b82f6); }
  .bf.green { background: linear-gradient(90deg, #059669, #10b981); }
  .bf.amber { background: linear-gradient(90deg, #d97706, #f59e0b); }
  .bf.red { background: linear-gradient(90deg, #dc2626, #ef4444); }
  .bf.purple { background: linear-gradient(90deg, #7c3aed, #8b5cf6); }
  .roi { background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border: 1px solid #a7f3d0; border-radius: 14px; padding: 24px; text-align: center; margin-bottom: 18px; }
  .roi .rv { font-size: 42px; font-weight: 800; color: #059669; letter-spacing: -1px; }
  .roi .rl { font-size: 14px; color: #047857; font-weight: 600; margin-top: 2px; }
  .roi .rs { font-size: 12px; color: #6ee7b7; margin-top: 4px; }
  .pill { display: inline-block; padding: 2px 10px; border-radius: 10px; font-size: 11px; font-weight: 600; }
  .pill.green { background: #d1fae5; color: #065f46; }
  .pill.red { background: #fee2e2; color: #991b1b; }
  .pill.amber { background: #fef3c7; color: #92400e; }
  .pill.blue { background: #dbeafe; color: #1e40af; }
  .pill.purple { background: #ede9fe; color: #5b21b6; }
  .footer { text-align: center; padding-top: 20px; border-top: 1px solid #e2e8f0; margin-top: 10px; }
  .footer p { color: #94a3b8; font-size: 11px; }
  .footer .logo { font-weight: 700; color: #0f172a; font-size: 14px; margin-bottom: 4px; }
  .tag { font-size: 11px; color: #94a3b8; }
  .dw { display: flex; gap: 4px; align-items: flex-end; }
  .dw > div { flex: 1; text-align: center; }
  .dw .bar-vis { height: 48px; background: #f1f5f9; border-radius: 4px; position: relative; overflow: hidden; }
  .dw .bar-vis .fill { position: absolute; bottom: 0; left: 0; right: 0; border-radius: 4px; background: linear-gradient(180deg, #3b82f6, #2563eb); }
  .dw .lbl { font-size: 10px; color: #94a3b8; margin-bottom: 2px; }
  .dw .val { font-size: 13px; font-weight: 700; margin-top: 3px; }
  .alert-box { background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); border: 1px solid #fecaca; border-radius: 12px; padding: 16px 18px; margin-bottom: 18px; font-size: 13px; }
  .alert-box.amber { background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%); border-color: #fde68a; }
  .alert-box.blue { background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border-color: #bfdbfe; }
  @media print { .page { padding: 0; } }
  @media (max-width: 600px) { .grid-4 { grid-template-columns: 1fr 1fr; } .grid-3 { grid-template-columns: 1fr 1fr; } .grid-2 { grid-template-columns: 1fr; } }
</style>
</head>
<body>
<div class="page">

  <div class="header">
    <h1>Oriveo &mdash; Monthly Performance Report</h1>
    <div class="sub">${data.orgName} &bull; ${data.monthName}</div>
    <div class="badge">Generated ${data.generatedAt} &bull; Confidential</div>
  </div>

  <!-- EXECUTIVE SUMMARY -->
  <div class="roi">
    <div class="rv">${s(data.noShowSavings) >= 0 ? '$' + s(data.noShowSavings).toLocaleString() : '$0'}</div>
    <div class="rl">Estimated Cost Savings This Month</div>
    <div class="rs">No-show reduction vs ${data.prevMonthName} &bull; \$150 avg/missed appointment &bull; ${s(data.prevNoShowRate)}% &#8594; ${s(data.noShowRate)}%</div>
  </div>

  <div class="grid-4">
    <div class="kpi"><div class="kv primary">${s(data.totalCalls)}</div><div class="kl">Total Calls</div><div class="ks">${s(data.callGrowth) >= 0 ? '+' : ''}${s(data.callGrowth)}% vs prev</div></div>
    <div class="kpi"><div class="kv green">${s(data.answerRate)}%</div><div class="kl">Answer Rate</div><div class="ks">${s(data.answeredCalls)} patients answered</div></div>
    <div class="kpi"><div class="kv purple">${s(data.avgQAOverall)}</div><div class="kl">Avg QA Score</div><div class="ks">${s(data.scoredCalls)} calls scored</div></div>
    <div class="kpi"><div class="kv">${s(data.voiceMinutes)}</div><div class="kl">Voice Minutes</div><div class="ks">${s(data.avgDuration)}s avg call</div></div>
  </div>

  <!-- CALL VOLUME BY DAY -->
  <div class="section">
    <div class="section-title">Call Volume by Day of Week</div>
    <div class="dw">${dayRow}</div>
    <div style="margin-top:8px;font-size:12px;color:#64748b;text-align:center;">
      ${s(data.peakHour) !== null ? `Peak hour: ${s(data.peakHour).toString().padStart(2,'0')}:00 &bull; ${s(data.peakHourCount)} calls` : 'No call data'}
    </div>
  </div>

  <!-- CALL OPERATIONS -->
  <div class="section">
    <div class="section-title">Call Operations <span class="ct">${s(data.totalCalls)}</span></div>
    <div class="grid-2">
      <div>
        <div class="sr"><span class="sl">Completed</span><span class="sv green">${s(data.completed)} (${s(data.completionRate)}%)</span></div>
        <div class="sr"><span class="sl">Failed</span><span class="sv red">${s(data.failed)}</span></div>
        <div class="sr"><span class="sl">In Progress</span><span class="sv primary">${s(data["in-progress"])}</span></div>
        <div class="sr"><span class="sl">Scheduled</span><span class="sv amber">${s(data.scheduled)}</span></div>
        <div class="sr"><span class="sl">Transferred / Cancelled</span><span class="sv">${s(data.transferred)} / ${s(data.cancelled)}</span></div>
      </div>
      <div>
        <div class="sr"><span class="sl">Outbound / Inbound</span><span class="sv">${s(data.outboundCalls)} / ${s(data.inboundCalls)}</span></div>
        <div class="sr"><span class="sl">Emergencies Detected</span><span class="sv"><span class="pill red">${s(data.emergencyCalls)}</span></span></div>
        <div class="sr"><span class="sl">High Severity (7+)</span><span class="sv red">${s(data.highSeverityCalls)}</span></div>
        <div class="sr"><span class="sl">Avg AI Severity</span><span class="sv">${data.avgSeverity}/10</span></div>
        <div class="sr"><span class="sl">Recalls (total)</span><span class="sv">${s(data.recalls)}</span></div>
      </div>
    </div>
    <div style="margin-top:10px">
      <div class="bg">
        <div class="bl"><span>Completion Rate</span><span>${s(data.completionRate)}% ${s(data.completionGrowth) >= 0 ? '&#8593;' : '&#8595;'} ${Math.abs(s(data.completionGrowth))}%</span></div>
        <div class="br"><div class="bf" style="width:${s(data.completionRate)}%"></div></div>
      </div>
      <div class="bg">
        <div class="bl"><span>Answer Rate</span><span>${s(data.answerRate)}%</span></div>
        <div class="br"><div class="bf green" style="width:${s(data.answerRate)}%"></div></div>
      </div>
    </div>
  </div>

  <!-- TRIAGE DISTRIBUTION -->
  <div class="section">
    <div class="section-title">Triage &amp; Severity <span class="ct ${s(data.highSeverityCalls) > 0 ? 'red' : 'green'}">${s(data.highSeverityCalls)} high</span></div>
    <div class="grid-3">
      <div class="kpi"><div class="kv green">${s(data.triageCounts[1])}</div><div class="kl">Tier 1 (Urgent)</div><div class="ks">Immediate attention</div></div>
      <div class="kpi"><div class="kv amber">${s(data.triageCounts[2])}</div><div class="kl">Tier 2 (Moderate)</div><div class="ks">Needs follow-up</div></div>
      <div class="kpi"><div class="kv primary">${s(data.triageCounts[3])}</div><div class="kl">Tier 3 (Routine)</div><div class="ks">Standard calls</div></div>
    </div>
  </div>

  <!-- STAFF PERFORMANCE -->
  ${s(data.staffPerformance.length) > 0 ? `
  <div class="section">
    <div class="section-title">Staff Performance <span class="ct purple">${s(data.staffPerformance.length)} active</span></div>
    <div class="grid-2">
      ${data.staffPerformance.map((sp) => `
      <div class="kpi" style="text-align:left;padding:12px 16px;display:flex;justify-content:space-between;align-items:center;">
        <div><div class="kl" style="text-transform:none;letter-spacing:0;font-size:13px;color:#1e293b;">${sp.name}</div><div class="ks">${sp.calls} calls &bull; ${sp.completed} completed</div></div>
        <div class="kv primary" style="font-size:20px;">${sp.calls > 0 ? Math.round(sp.completed / sp.calls * 100) : 0}%</div>
      </div>
      `).join("")}
    </div>
  </div>
  ` : ""}

  <!-- TOP PATIENTS -->
  ${s(data.topPatients.length) > 0 ? `
  <div class="section">
    <div class="section-title">Most Engaged Patients</div>
    <div class="grid-2">
      ${data.topPatients.map((tp) => `
      <div class="sr"><span class="sl">${tp.name}</span><span class="sv">${tp.calls} calls ${s(tp.emergencies) > 0 ? '<span class="pill red" style="margin-left:6px;">'+tp.emergencies+' emerg.</span>' : ''}</span></div>
      `).join("")}
    </div>
  </div>
  ` : ""}

  <!-- QUALITY ASSURANCE -->
  <div class="section">
    <div class="section-title">Quality Assurance <span class="ct purple">${s(data.scoredCalls)} scored</span></div>
    <div class="grid-4">
      <div class="kpi"><div class="kv purple">${s(data.avgQAOverall)}</div><div class="kl">Overall</div></div>
      <div class="kpi"><div class="kv primary">${s(data.avgQAAccuracy)}</div><div class="kl">Accuracy</div></div>
      <div class="kpi"><div class="kv green">${s(data.avgQAEmpathy)}</div><div class="kl">Empathy</div></div>
      <div class="kpi"><div class="kv amber">${s(data.avgQAProfessionalism)}</div><div class="kl">Professionalism</div></div>
    </div>
    <div style="margin-top:4px">
      <div class="bg"><div class="bl"><span>Accuracy</span><span>${s(data.avgQAAccuracy)}%</span></div><div class="br"><div class="bf primary" style="width:${s(data.avgQAAccuracy)}%"></div></div></div>
      <div class="bg"><div class="bl"><span>Empathy</span><span>${s(data.avgQAEmpathy)}%</span></div><div class="br"><div class="bf green" style="width:${s(data.avgQAEmpathy)}%"></div></div></div>
      <div class="bg"><div class="bl"><span>Professionalism</span><span>${s(data.avgQAProfessionalism)}%</span></div><div class="br"><div class="bf amber" style="width:${s(data.avgQAProfessionalism)}%"></div></div></div>
      <div class="bg"><div class="bl"><span>Resolution</span><span>${s(data.avgQAResolution)}%</span></div><div class="br"><div class="bf purple" style="width:${s(data.avgQAResolution)}%"></div></div></div>
    </div>
  </div>

  <!-- APPOINTMENTS -->
  <div class="section">
    <div class="section-title">Appointment Management <span class="ct">${s(data.totalAppointments)}</span></div>
    <div class="grid-2">
      <div>
        <div class="sr"><span class="sl">Completed</span><span class="sv green">${s(data.completedAppts)} (${s(data.scheduleFillRate)}%)</span></div>
        <div class="sr"><span class="sl">No-Shows</span><span class="sv red">${s(data.noShows)} (${s(data.noShowRate)}%)</span></div>
        <div class="sr"><span class="sl">Cancelled</span><span class="sv amber">${s(data.cancellations)}</span></div>
      </div>
      <div>
        <div class="sr"><span class="sl">In-Person</span><span class="sv">${s(data.typeCounts["in-person"])}</span></div>
        <div class="sr"><span class="sl">Phone</span><span class="sv">${s(data.typeCounts["phone"])}</span></div>
        <div class="sr"><span class="sl">Video</span><span class="sv">${s(data.typeCounts["video"])}</span></div>
      </div>
    </div>
    <div class="grid-2" style="margin-top:10px">
      <div class="bg"><div class="bl"><span>Last Month No-Show</span><span>${s(data.prevNoShowRate)}%</span></div><div class="br"><div class="bf amber" style="width:${s(data.prevNoShowRate)}%"></div></div></div>
      <div class="bg"><div class="bl"><span>This Month No-Show</span><span>${s(data.noShowRate)}%</span></div><div class="br"><div class="bf ${s(data.noShowRate) <= s(data.prevNoShowRate) ? 'green' : 'red'}" style="width:${s(data.noShowRate)}%"></div></div></div>
    </div>
    ${s(data.topReasons.length) > 0 ? `
    <div style="margin-top:12px">
      <div style="font-size:12px;font-weight:700;color:#475569;margin-bottom:6px;">Top Appointment Reasons</div>
      ${data.topReasons.map(([reason, count]) => `<div class="sr"><span class="sl">${reason}</span><span class="sv">${count}</span></div>`).join("")}
    </div>
    ` : ""}
  </div>

  <!-- PATIENTS & STAFF -->
  <div class="section">
    <div class="section-title">Patients &amp; Staff</div>
    <div class="grid-3">
      <div class="kpi"><div class="kv primary">${s(data.patientCount)}</div><div class="kl">Active Patients</div><div class="ks">${s(data.newPatients)} new this month</div></div>
      <div class="kpi"><div class="kv green">${s(data.userCount)}</div><div class="kl">Active Staff</div><div class="ks">${s(data.adminCount)} admin &bull; ${s(data.staffCount)} staff</div></div>
      <div class="kpi"><div class="kv purple">${s(data.portalBookings)}</div><div class="kl">Portal Bookings</div><div class="ks">Patient self-scheduled</div></div>
    </div>
  </div>

  <!-- LANGUAGE DISTRIBUTION -->
  ${s(data.langDist.length) > 1 ? `
  <div class="section">
    <div class="section-title">Languages Used</div>
    <div class="grid-2">
      ${data.langDist.map(([lang, count]) => `<div class="sr"><span class="sl">${lang.toUpperCase()}</span><span class="sv">${count} calls</span></div>`).join("")}
    </div>
  </div>
  ` : ""}

  <!-- RESOURCES & ACTIVITY -->
  <div class="section">
    <div class="section-title">Resources &amp; Activity</div>
    <div class="grid-4">
      <div class="kpi"><div class="kv">${s(data.questionnaireCount)}</div><div class="kl">Templates</div><div class="ks">${s(data.defaultTemplates)} default</div></div>
      <div class="kpi"><div class="kv">${s(data.docCount)}</div><div class="kl">Knowledge Docs</div><div class="ks">Medical references</div></div>
      <div class="kpi"><div class="kv">${s(data.reportsGenerated)}</div><div class="kl">Reports</div><div class="ks">Generated this month</div></div>
      <div class="kpi"><div class="kv">${s(data.notificationsSent)}</div><div class="kl">Notifications</div><div class="ks">Sent this month</div></div>
    </div>
    <div class="grid-2" style="margin-top:8px">
      <div class="sr"><span class="sl">Audit Log Entries</span><span class="sv">${s(data.auditLogCount)}</span></div>
      <div class="sr"><span class="sl">Total Voice Duration</span><span class="sv">${s(data.voiceMinutes)} min</span></div>
    </div>
  </div>

  <div class="footer">
    <div class="logo">Oriveo Healthcare Platform</div>
    <p>Automatically generated from your workspace on ${data.generatedAt}.</p>
    <p>For questions: support@oriveo.io</p>
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
