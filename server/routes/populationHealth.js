import { Router } from "express";
import { protect } from "../middleware/auth.js";
import Patient from "../models/Patient.js";
import Call from "../models/Call.js";
import Appointment from "../models/Appointment.js";
import User from "../models/User.js";
import Subscription from "../models/Subscription.js";

const router = Router();
router.use(protect);

router.get("/summary", async (req, res) => {
  try {
    if (!req.user.superAdmin && !req.user?.organization) {
      return res.status(400).json({ message: "No organization found" });
    }

    const filter = { ...req.tenantFilter };
    const orgId = req.user.organization;
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart.getTime() + 86400000);
    const thirtyDaysAgo = new Date(todayStart);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [patients, calls, appointments, users, subscription] = await Promise.all([
      Patient.find({ ...filter, isActive: true }).select("name primaryDiagnosis").lean(),
      Call.find(filter).select("patient status aiSeverityScore createdAt aiSummary qaScore emergencyDetected emergencyActionTaken startedBy duration").sort({ createdAt: -1 }).lean(),
      Appointment.find({ ...filter, date: { $gte: thirtyDaysAgo } }).select("status date").lean(),
      User.find({ ...filter, isActive: true }).select("role").lean(),
      orgId ? Subscription.findOne({ organization: orgId }).lean() : null,
    ]);

    const nameMap = {};
    for (const p of patients) nameMap[p._id.toString()] = p.name || "Unknown";

    // --- Oriveo Index ---
    const totalCalls = calls.length;
    const completedCalls = calls.filter((c) => c.status === "completed");
    const callCompletionRate = totalCalls > 0 ? Math.round((completedCalls.length / totalCalls) * 100) : 0;

    const withSeverity = calls.filter((c) => c.aiSeverityScore != null);
    const avgSeverity = withSeverity.length > 0
      ? withSeverity.reduce((s, c) => s + c.aiSeverityScore, 0) / withSeverity.length : 0;
    const severityInverse = Math.round((1 - avgSeverity / 10) * 100);

    const withQA = calls.filter((c) => c.qaScore?.overall != null);
    const avgQA = withQA.length > 0
      ? Math.round(withQA.reduce((s, c) => s + c.qaScore.overall, 0) / withQA.length) : 0;

    const recentPatientCount = new Set(
      calls.filter((c) => c.createdAt && new Date(c.createdAt) >= thirtyDaysAgo && c.patient)
        .map((c) => c.patient.toString())
    ).size;
    const engagement = patients.length > 0 ? Math.round((recentPatientCount / patients.length) * 100) : 0;

    const totalAppts = appointments.length;
    const noShowAppts = appointments.filter((a) => a.status === "no-show").length;
    const noShowRate = totalAppts > 0 ? (noShowAppts / totalAppts) * 100 : 0;
    const noShowInverse = Math.round(100 - noShowRate);

    const oriveoIndex = Math.min(100, Math.max(0, Math.round(
      callCompletionRate * 0.25 + severityInverse * 0.20 + avgQA * 0.20 + engagement * 0.15 + noShowInverse * 0.20
    )));

    // --- Practice Stats ---
    const callsToday = calls.filter((c) => c.createdAt && new Date(c.createdAt) >= todayStart);
    const activeCalls = calls.filter((c) => c.status === "in-progress").length;
    const emergenciesToday = calls.filter((c) => c.emergencyDetected && c.createdAt && new Date(c.createdAt) >= todayStart).length;

    // --- Call Status Breakdown ---
    const statusCounts = {};
    for (const c of calls) statusCounts[c.status] = (statusCounts[c.status] || 0) + 1;

    // --- Appointment Stats (today) ---
    const apptsToday = await Appointment.find({ ...filter, date: { $gte: todayStart, $lt: todayEnd } }).select("status").lean();
    const apptStatusCounts = {};
    for (const a of apptsToday) apptStatusCounts[a.status] = (apptStatusCounts[a.status] || 0) + 1;

    // --- Team Stats ---
    const roleCounts = {};
    for (const u of users) roleCounts[u.role] = (roleCounts[u.role] || 0) + 1;

    // --- Patient Tiles ---
    const tileMap = {};
    for (const p of patients) {
      const pid = p._id.toString();
      tileMap[pid] = { _id: p._id, name: p.name, condition: p.primaryDiagnosis || "", severity: null, status: "no-data", daysSinceLastCall: null };
    }
    for (const c of calls) {
      if (c.patient) {
        const pid = c.patient.toString();
        const tile = tileMap[pid];
        if (tile && tile.daysSinceLastCall === null) {
          tile.severity = c.aiSeverityScore;
          tile.daysSinceLastCall = Math.floor((now - new Date(c.createdAt)) / 86400000);
          if (c.emergencyDetected || c.emergencyActionTaken !== "none") tile.status = "emergency";
          else if ((c.aiSeverityScore || 0) >= 7) tile.status = "critical";
          else if ((c.aiSeverityScore || 0) >= 4) tile.status = "watching";
          else if (c.aiSeverityScore != null) tile.status = "stable";
        }
      }
    }
    const sortOrder = { emergency: 0, critical: 1, watching: 2, stable: 3, "no-data": 4 };
    const patientTiles = Object.values(tileMap).sort(
      (a, b) => (sortOrder[a.status] || 5) - (sortOrder[b.status] || 5) || (a.name || "").localeCompare(b.name || "")
    ).slice(0, 24);

    // --- Call Volume (last 7 days) ---
    const volumeMap = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(todayStart);
      d.setDate(d.getDate() - i);
      volumeMap[d.toISOString().split("T")[0]] = 0;
    }
    for (const c of calls) {
      if (c.createdAt) {
        const day = new Date(c.createdAt).toISOString().split("T")[0];
        if (day in volumeMap) volumeMap[day]++;
      }
    }
    const callVolume = Object.entries(volumeMap).map(([date, count]) => ({
      date,
      label: new Date(date).toLocaleDateString("en-US", { weekday: "short" }),
      count,
    }));

    // --- Severity Distribution ---
    const severityDist = { low: 0, medium: 0, high: 0 };
    for (const c of completedCalls) {
      const s = c.aiSeverityScore || 0;
      if (s >= 7) severityDist.high++;
      else if (s >= 4) severityDist.medium++;
      else severityDist.low++;
    }

    // --- Activity ---
    const todayCalls = calls.filter((c) => c.createdAt && new Date(c.createdAt) >= todayStart);
    const liveActivity = todayCalls.slice(0, 10).map((c) => ({
      type: c.emergencyDetected ? "emergency" : c.status === "completed" ? "checkup_complete" : c.status === "failed" ? "call_failed" : "call_started",
      message: c.emergencyDetected ? "Emergency detected" : c.status === "completed" ? "Checkup completed" : c.status === "failed" ? "Checkup failed" : "Call started",
      timestamp: c.createdAt,
      patient: nameMap[c.patient?.toString() || ""] || "Unknown",
      severity: c.aiSeverityScore,
      status: c.status,
    }));

    // --- Risk Predictions ---
    const patientCallHistory = {};
    for (const c of calls) {
      if (c.patient && c.aiSeverityScore != null) {
        const pid = c.patient.toString();
        if (!patientCallHistory[pid]) patientCallHistory[pid] = [];
        patientCallHistory[pid].push({ severity: c.aiSeverityScore, date: c.createdAt });
      }
    }
    const riskPredictions = [];
    for (const [pid, history] of Object.entries(patientCallHistory)) {
      const sorted = history.sort((a, b) => new Date(b.date) - new Date(a.date));
      if (sorted.length >= 3 && sorted[0].severity > sorted[1].severity && sorted[1].severity >= sorted[2].severity) {
        const increment = Math.round(sorted[0].severity - sorted[2].severity);
        riskPredictions.push({
          patientId: pid, patientName: nameMap[pid] || "Unknown",
          currentSeverity: sorted[0].severity, previousSeverity: sorted[2].severity,
          predictedSeverity: Math.min(10, Math.round(sorted[0].severity + increment)), trend: "up",
        });
      }
    }
    riskPredictions.sort((a, b) => b.currentSeverity - a.currentSeverity);

    // --- Completion Rate ---
    const completionRate = totalCalls > 0 ? Math.round((completedCalls.length / totalCalls) * 100) : 0;

    // --- Average Duration ---
    const callsWithDuration = completedCalls.filter((c) => c.duration);
    const avgDuration = callsWithDuration.length > 0
      ? Math.round(callsWithDuration.reduce((s, c) => s + c.duration, 0) / callsWithDuration.length)
      : 0;

    res.json({
      oriveoIndex,
      indexBreakdown: { callCompletion: callCompletionRate, severityTrend: severityInverse, qaScore: avgQA, engagement, noShowInverse },
      practiceStats: {
        totalPatients: patients.length, activeCalls, callsToday: callsToday.length, emergencies: emergenciesToday,
        completionRate, avgQA, avgSeverity: avgSeverity.toFixed(1), avgDuration, noShowRate: Math.round(noShowRate),
      },
      appointmentStats: {
        today: apptStatusCounts, totalToday: apptsToday.length,
        scheduled: apptStatusCounts["scheduled"] || 0, completed: apptStatusCounts["completed"] || 0,
        noShow: apptStatusCounts["no-show"] || 0, cancelled: apptStatusCounts["cancelled"] || 0,
      },
      teamStats: { total: users.length, ...roleCounts },
      subscription: subscription ? {
        plan: subscription.plan, status: subscription.status,
        maxUsers: subscription.limits?.maxUsers, maxPatients: subscription.limits?.maxPatients, maxMonthlyCalls: subscription.limits?.maxMonthlyCalls,
      } : null,
      callStatusBreakdown: statusCounts,
      callVolume,
      severityDistribution: severityDist,
      patientTiles,
      liveActivity: liveActivity.slice(0, 10),
      riskPredictions: riskPredictions.slice(0, 4),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
