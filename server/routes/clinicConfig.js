import { Router } from "express";
import { protect } from "../middleware/auth.js";
import { getFeaturesForOrg } from "../middleware/features.js";
import { CLINIC_TYPES, getSpecialtiesForType, SPECIALTY_DASHBOARD_LABELS } from "../config/specialties.js";
import { getBillingCodeSet } from "../config/billing.js";
import Patient from "../models/Patient.js";
import Call from "../models/Call.js";
import Appointment from "../models/Appointment.js";
import { getReportTemplate, getTemplatesForClinicType } from "../config/reportTemplates.js";

const router = Router();

router.get("/types", (req, res) => {
  res.json({ types: CLINIC_TYPES });
});

router.get("/specialties/:type", (req, res) => {
  const { type } = req.params;
  const specialties = getSpecialtiesForType(type);
  if (!specialties || specialties.length === 0) {
    return res.status(404).json({ message: "Invalid clinic type" });
  }
  res.json({ specialties });
});

router.get("/billing/:codeSet", (req, res) => {
  const { codeSet } = req.params;
  const billing = getBillingCodeSet(codeSet);
  res.json({ billing });
});

router.get("/dashboard-config/:specialty", (req, res) => {
  const { specialty } = req.params;
  const config = SPECIALTY_DASHBOARD_LABELS[specialty] || { title: "Dashboard", subtitle: "Overview" };
  res.json({ config });
});

router.get("/report-templates/:specialty", (req, res) => {
  const { specialty } = req.params;
  const template = getReportTemplate(specialty);
  res.json({ template: { id: specialty, label: template.label, clinicType: template.clinicType, standard: template.standard, sections: template.sections, assessmentScales: template.assessmentScales, billingCodeSet: template.billingCodeSet } });
});

router.get("/report-templates", (req, res) => {
  const { clinicType } = req.query;
  if (clinicType) {
    return res.json({ templates: getTemplatesForClinicType(clinicType) });
  }
  const human = getTemplatesForClinicType("human");
  const dental = getTemplatesForClinicType("dental");
  const veterinary = getTemplatesForClinicType("veterinary");
  res.json({ human, dental, veterinary });
});

router.get("/features", protect, (req, res) => {
  const org = req.user?.organization || null;
  const features = getFeaturesForOrg(org);
  res.json({ features });
});

router.get("/dashboard-data", protect, async (req, res) => {
  try {
    const orgId = req.user?.organization;
    if (!orgId) {
      return res.status(400).json({ message: "No organization found" });
    }

    const filter = { organization: orgId };
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart.getTime() + 86400000);
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());

    const [
      activePatients,
      patientsToday,
      completedCalls,
      callsThisWeek,
      callsNeedingFollowUp,
      totalCallCounts,
      appointmentsToday,
      appointmentStatusCounts,
    ] = await Promise.all([
      Patient.countDocuments({ ...filter, isActive: true }),
      Patient.countDocuments({ ...filter, createdAt: { $gte: todayStart, $lt: todayEnd } }),
      Call.find({ ...filter, status: "completed" }).select("aiSeverityScore createdAt aiSummary").sort({ createdAt: -1 }).lean(),
      Call.find({ ...filter, createdAt: { $gte: weekStart } }).select("status").lean(),
      Call.countDocuments({ ...filter, aiSeverityScore: { $gte: 5 } }),
      Call.aggregate([
        { $match: filter },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      Appointment.countDocuments({ ...filter, date: { $gte: todayStart, $lt: todayEnd } }),
      Appointment.aggregate([
        { $match: filter },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
    ]);

    const aiAssessments = completedCalls.length;

    let avgSeverity = "—";
    if (completedCalls.length > 0) {
      const sum = completedCalls.reduce((s, c) => s + (c.aiSeverityScore || 0), 0);
      avgSeverity = (sum / completedCalls.length).toFixed(1);
    }

    const weeklyUnits = callsThisWeek.filter((c) => c.status === "completed").length;

    let avgProgress = "—";
    const recent5 = completedCalls.slice(0, 5);
    const older5 = completedCalls.slice(5, 10);
    if (recent5.length > 0 && older5.length > 0) {
      const recentAvg = recent5.reduce((s, c) => s + (c.aiSeverityScore || 0), 0) / recent5.length;
      const olderAvg = older5.reduce((s, c) => s + (c.aiSeverityScore || 0), 0) / older5.length;
      if (olderAvg > 0) {
        const change = ((olderAvg - recentAvg) / olderAvg) * 100;
        avgProgress = (change >= 0 ? "+" : "") + change.toFixed(0) + "%";
      }
    }

    const callStatusMap = {};
    for (const s of totalCallCounts) callStatusMap[s._id] = s.count;
    const inProgress = callStatusMap["in-progress"] || 0;
    const failed = callStatusMap["failed"] || 0;
    const totalCheckups = callStatusMap["completed"] || 0;

    const apptStatusMap = {};
    for (const s of appointmentStatusCounts) apptStatusMap[s._id] = s.count;
    const totalAppts = appointmentStatusCounts.reduce((sum, s) => sum + s.count, 0);
    const noShowRate = totalAppts > 0 ? ((apptStatusMap["no-show"] || 0) / totalAppts * 100).toFixed(1) + "%" : "0%";

    res.json({
      data: {
        patientsToday,
        appointments: appointmentsToday,
        avgSeverity,
        aiAssessments,
        followUps: callsNeedingFollowUp,
        weeklyUnits,
        avgProgress,
        activeTreatments: activePatients,
        ecgReads: "—",
        bpAlerts: "—",
        moodAssessments: "—",
        medReviews: "—",
        adjustmentsDue: "—",
        xraysPending: "—",
        surgeriesToday: "—",
        postOpFollowups: "—",
        hygieneDue: "—",
        labCases: "—",
        vaccinationsDue: "—",
        farmVisits: "—",
        cogginsTests: "—",
        spayNeuterQueue: "—",
        dentalCleanings: "—",
        wellnessExams: "—",
        inPatients: "—",
        inProgress,
        failed,
        totalCheckups,
        noShowRate,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
