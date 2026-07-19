import { Router } from "express";
import { z } from "zod";
import { protect, authorize } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { reportQuerySchema, signReportSchema, bulkSignSchema, bulkDeleteSchema } from "../validators/report.js";
import Report from "../models/Report.js";
import { generateReport, generateAllMissingReports } from "../services/reportGenerator.js";
import { convertReportToFhirBundle } from "../services/fhirConverter.js";
import { SPECIALTY_DASHBOARD_LABELS } from "../config/specialties.js";
import PDFDocument from "pdfkit";

const idParam = z.object({ id: z.string().regex(/^[a-f\d]{24}$/i, "Invalid ID") });
const callIdParam = z.object({ callId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid call ID") });

const router = Router();
router.use(protect);

router.get("/", validate(reportQuerySchema, "query"), async (req, res) => {
  try {
    const { page = 1, limit = 50, patientId, signed, sort = "-createdAt" } = req.query;
    const filter = {};
    if (patientId) filter.patient = patientId;
    if (signed === "true") filter.doctorSigned = true;
    if (signed === "false") filter.doctorSigned = false;

    const total = await Report.countDocuments(filter);
    const reports = await Report.find(filter)
      .populate("patient", "name phone")
      .populate("call", "duration startedAt status")
      .sort(sort)
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    res.json({ reports, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/:id", validate(idParam, "params"), async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate("patient", "name phone dob gender")
      .populate("call")
      .populate("generatedBy", "name")
      .populate("signedBy", "name");
    if (!report) return res.status(404).json({ message: "Report not found" });
    res.json({ report });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/:id/pdf", validate(idParam, "params"), async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate("patient", "name phone dob gender")
      .populate("call")
      .populate("generatedBy", "name")
      .populate("signedBy", "name");
    if (!report) return res.status(404).json({ message: "Report not found" });

    const doc = new PDFDocument({ margin: 50, size: "A4" });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="report-${report._id}.pdf"`);
    doc.pipe(res);

    const font = "Helvetica";
    const bold = "Helvetica-Bold";
    const specialty = report.specialty || "general-practice";
    const clinicType = report.clinicType || "human";
    const specialtyLabel = SPECIALTY_DASHBOARD_LABELS[specialty] || { title: "Medical Report" };
    const primaryColor = clinicType === "dental" ? "#0d9488" : clinicType === "veterinary" ? "#7c3aed" : "#0a7c6f";
    const top = 50;
    let y = top;

    doc.fontSize(20).font(bold).fillColor(primaryColor).text(`${specialtyLabel.title}`, { align: "left" });
    y = doc.y + 4;
    doc.fontSize(8).font(font).fillColor("#666")
      .text(`Report ID: ${report._id.toString().slice(-8)} | ${report.callDate ? new Date(report.callDate).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : ""} | Specialty: ${specialtyLabel.title}`, { align: "left" });
    y = doc.y + 12;

    doc.moveTo(50, y).lineTo(545, y).strokeColor("#ddd").lineWidth(1).stroke();
    y += 12;

    const section = (title) => {
      doc.fontSize(11).font(bold).fillColor(primaryColor).text(title, 50, y + 4);
      y = doc.y + 8;
    };

    const row = (label, value) => {
      if (!value) return;
      doc.fontSize(9).font(font).fillColor("#333");
      doc.text(label, 50, y, { width: 120, continued: true });
      doc.fillColor("#111").text(String(value), 170, y);
      y = doc.y + 2;
    };

    const body = (text) => {
      doc.fontSize(9).font(font).fillColor("#333").text(text || "N/A", 50, y, { width: 495 });
      y = Math.max(doc.y, y) + 4;
    };

    section("Patient Information");
    row("Name", report.patientInfo?.name);
    row("Age", report.patientInfo?.age);
    row("Gender", report.patientInfo?.gender);
    row("Phone", report.patientInfo?.phone);
    row("Duration", report.callDuration ? `${Math.floor(report.callDuration / 60)}m ${report.callDuration % 60}s` : "");
    y += 4;

    if (report.chiefComplaint) {
      section("Chief Complaint");
      body(report.chiefComplaint);
    }

    if (report.symptomsCaptured?.length) {
      section("Symptoms Captured");
      for (const s of report.symptomsCaptured) {
        doc.circle(58, y - 2, 2).fillColor("#999").fill();
        doc.fontSize(9).font(bold).fillColor("#333").text(s.symptom, 65, y, { continued: true });
        if (s.severity) {
          doc.fontSize(7).font(font).fillColor(s.severity === "severe" ? "#dc2626" : s.severity === "moderate" ? "#d97706" : "#16a34a")
            .text(`  ${s.severity}`, { continued: false });
        } else {
          doc.text("", { continued: false });
        }
        y = doc.y + 1;
      }
      y += 4;
    }

    if (report.redFlags?.length) {
      doc.rect(50, y, 495, report.redFlags.length * 12 + 20).fillColor("#fef2f2").fill();
      doc.fontSize(9).font(bold).fillColor("#dc2626").text("Red Flags", 56, y + 4);
      y = doc.y + 2;
      for (const f of report.redFlags) {
        doc.fontSize(8).font(font).fillColor("#991b1b").text(`  •  ${f}`, 56, y);
        y = doc.y + 1;
      }
      y += 6;
    }

    section("Triage Assessment");
    const triageLabels = ["Emergency", "Urgent", "Semi-Urgent", "Non-Urgent", "Routine"];
    const triageColors = ["#dc2626", "#ea580c", "#d97706", "#2563eb", "#16a34a"];
    const tl = report.triageLevel ?? 3;
    if (tl >= 0 && tl < triageLabels.length) {
      doc.fontSize(9).font(bold).fillColor(triageColors[tl]).text(`${triageLabels[tl]} (Level ${tl})`, 50, y);
    } else {
      doc.fontSize(9).font(font).fillColor("#333").text("Unknown", 50, y);
    }
    y = doc.y + 8;

    if (report.aiAssessment) {
      section("AI Assessment");
      body(report.aiAssessment);
    }

    if (report.adviceGiven) {
      section("Advice Given");
      body(report.adviceGiven);
    }

    if (report.medicationsReviewed || report.allergiesFlagged || report.chronicConditions) {
      section("Medical Context");
      row("Medications Reviewed", report.medicationsReviewed);
      row("Allergies Flagged", report.allergiesFlagged);
      row("Chronic Conditions", report.chronicConditions);
      row("Vitals Mentioned", report.vitalsMentioned);
      y += 4;
    }

    if (report.keyExchanges?.length) {
      section("Key Exchanges");
      for (const e of report.keyExchanges.slice(0, 8)) {
        doc.rect(50, y, 495, 0).strokeColor(e.speaker === "AI" ? "#dbeafe" : "#f3f4f6").fillColor(e.speaker === "AI" ? "#eff6ff" : "#f9fafb").fill();
        doc.fontSize(7).font(bold).fillColor(e.speaker === "AI" ? "#2563eb" : "#6b7280").text(e.speaker, 54, y + 2);
        y = doc.y;
        doc.fontSize(8).font(font).fillColor("#333").text(e.text, 54, y, { width: 480 });
        y = Math.max(doc.y, y) + 2;
      }
      y += 4;
    }

    if (report.nextSteps?.length) {
      section("Next Steps");
      for (const s of report.nextSteps) {
        doc.circle(58, y - 1, 2.5).fillColor(primaryColor).fill();
        doc.fontSize(9).font(font).fillColor("#333").text(s, 65, y, { width: 480 });
        y = doc.y + 1;
      }
      y += 4;
    }

    if (report.aiQaScores?.overall != null) {
      section("AI Quality Scores");
      const scores = [["Accuracy", report.aiQaScores.accuracy], ["Empathy", report.aiQaScores.empathy], ["Professionalism", report.aiQaScores.professionalism], ["Adherence", report.aiQaScores.adherence], ["Resolution", report.aiQaScores.resolution], ["Overall", report.aiQaScores.overall]];
      const xStart = 50;
      const boxW = 70;
      const boxH = 40;
      const gap = 8;
      scores.forEach(([label, val], i) => {
        if (val == null) return;
        const bx = xStart + i * (boxW + gap);
        doc.rect(bx, y, boxW, boxH).fillColor("#f9fafb").fill().strokeColor("#e5e7eb").lineWidth(1).stroke();
        doc.fontSize(7).font(bold).fillColor("#666").text(String(label), bx, y + 6, { width: boxW, align: "center" });
        doc.fontSize(14).font(bold).fillColor(val >= 80 ? "#059669" : val >= 60 ? "#d97706" : "#dc2626")
          .text(`${Math.round(Number(val))}%`, bx, y + 18, { width: boxW, align: "center" });
      });
      y += boxH + 12;
    }

    if (report.callSummary) {
      section("Clinical Summary");
      body(report.callSummary);
    }

    // Specialty-specific data sections
    const sd = report.specialtyData || {};
    if (sd.diagnosisCodes?.length) {
      section("Diagnosis Codes");
      for (const dx of sd.diagnosisCodes) {
        doc.fontSize(9).font(font).fillColor("#333").text(`${dx.code} - ${dx.name}${dx.laterality && dx.laterality !== "unspecified" ? ` (${dx.laterality})` : ""}`, 50, y, { width: 495 });
        y = doc.y + 1;
      }
      y += 4;
    }

    if (sd.assessmentScales?.length) {
      section("Assessment Scales / Scores");
      for (const scale of sd.assessmentScales) {
        row(scale.label || scale.scaleId, `${scale.score}${scale.interpretation ? ` - ${scale.interpretation}` : ""}`);
      }
      y += 4;
    }

    if (sd.imagingFindings) {
      section("Imaging Findings");
      body(sd.imagingFindings);
    }

    if (sd.labResults) {
      section("Laboratory Results");
      body(sd.labResults);
    }

    if (sd.examFindings?.length) {
      section("Specialty Examination Findings");
      for (const exam of sd.examFindings) {
        doc.fontSize(9).font(bold).fillColor("#333").text(exam.testName || "Finding", 50, y, { continued: true });
        doc.font(font).fillColor("#555").text(`: ${exam.result || exam.interpretation || ""}`, { continued: false });
        y = doc.y + 1;
      }
      y += 4;
    }

    if (sd.proceduresPerformed?.length) {
      section("Procedures Performed");
      for (const proc of sd.proceduresPerformed) {
        doc.circle(58, y - 1, 2.5).fillColor(primaryColor).fill();
        doc.fontSize(9).font(font).fillColor("#333").text(proc, 65, y, { width: 480 });
        y = doc.y + 1;
      }
      y += 4;
    }

    if (sd.treatmentSummary) {
      section("Treatment Summary");
      body(sd.treatmentSummary);
    }

    if (sd.followUpRecommendation) {
      section("Follow-Up Recommendation");
      body(sd.followUpRecommendation);
    }

    // Vital signs block if present
    if (report.vitals) {
      const v = report.vitals;
      const hasVitals = v.bpSystolic || v.bpDiastolic || v.heartRate || v.temperature || v.weight || v.spo2 || v.respiratoryRate;
      if (hasVitals) {
        section("Vital Signs");
        const vitalsStr = [
          v.bpSystolic ? `BP: ${v.bpSystolic}/${v.bpDiastolic || "?"} mmHg` : null,
          v.heartRate ? `HR: ${v.heartRate} bpm` : null,
          v.respiratoryRate ? `RR: ${v.respiratoryRate} /min` : null,
          v.temperature ? `Temp: ${v.temperature}°C` : null,
          v.spo2 ? `O2: ${v.spo2}%` : null,
          v.weight ? `Weight: ${v.weight} kg` : null,
        ].filter(Boolean).join("  |  ");
        body(vitalsStr);
      }
    }

    y += 8;
    doc.moveTo(50, y).lineTo(545, y).strokeColor("#ddd").lineWidth(1).stroke();
    y += 8;
    doc.fontSize(7).font(font).fillColor("#999")
      .text(`Generated by AI${report.generatedBy?.name ? ` (${report.generatedBy.name})` : ""} | ${report.createdAt ? new Date(report.createdAt).toLocaleString() : ""}`, 50, y);

    if (report.doctorSigned) {
      y += 10;
      doc.rect(50, y, 495, 45).fillColor("#ecfdf5").fill();
      doc.fontSize(8).font(bold).fillColor("#047857")
        .text(`Digitally Signed`, 56, y + 4);
      y = doc.y + 2;
      doc.font(font).fontSize(11).fillColor("#065f46")
        .text(report.digitalSignature || report.signedBy?.name || "Doctor", 56, y);
      y = doc.y + 2;
      doc.fontSize(7).font(font).fillColor("#047857")
        .text(`${report.signedBy?.name || "Doctor"}${report.signatureTitle ? `, ${report.signatureTitle}` : ""}`, 56, y);
      y = doc.y + 1;
      doc.fontSize(7).font(font).fillColor("#059669")
        .text(`Signed on ${report.signedAt ? new Date(report.signedAt).toLocaleString() : ""}`, 56, y);
      y += 20;
    }

    if (report.doctorNotes) {
      doc.fontSize(8).font(bold).fillColor("#333").text("Doctor's notes:", 50, y);
      y = doc.y + 1;
      doc.fontSize(8).font(font).fillColor("#555").text(report.doctorNotes, 50, y, { width: 495 });
      y = doc.y + 4;
    }

    doc.end();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/:id/fhir", validate(idParam, "params"), async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate("patient", "name phone dob gender")
      .populate("call")
      .populate("generatedBy", "name")
      .populate("signedBy", "name");
    if (!report) return res.status(404).json({ message: "Report not found" });
    const bundle = convertReportToFhirBundle(report, `${req.protocol}://${req.get("host")}/api/reports`);
    res.setHeader("Content-Type", "application/fhir+json");
    res.json(bundle);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/call/:callId", validate(callIdParam, "params"), async (req, res) => {
  try {
    const report = await Report.findOne({ call: req.params.callId })
      .populate("patient", "name phone dob gender")
      .populate("call")
      .populate("generatedBy", "name")
      .populate("signedBy", "name");
    res.json({ report });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/generate/:callId", authorize("admin", "doctor"), validate(callIdParam, "params"), async (req, res) => {
  try {
    const report = await generateReport(req.params.callId);
    res.status(201).json({ report });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/generate-all", authorize("admin", "doctor"), async (req, res) => {
  try {
    const results = await generateAllMissingReports();
    res.json({ generated: results.filter((r) => r.status === "ok").length, failed: results.filter((r) => r.status === "error").length, results });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/:id/sign", authorize("admin", "doctor"), validate(idParam, "params"), validate(signReportSchema), async (req, res) => {
  try {
    const { doctorNotes, digitalSignature } = req.body;
    const signatureName = digitalSignature || req.user.name;
    const roleTitleMap = { doctor: "MD", admin: "Clinic Administrator", nurse: "RN", receptionist: "Receptionist" };
    const titleParts = [];
    if (roleTitleMap[req.user.role]) titleParts.push(roleTitleMap[req.user.role]);
    if (req.user.specialty) titleParts.push(req.user.specialty);
    const signatureTitle = titleParts.length ? titleParts.join(", ") : "";

    const report = await Report.findByIdAndUpdate(
      req.params.id,
      {
        doctorSigned: true,
        signedBy: req.user._id,
        signedAt: new Date(),
        digitalSignature: signatureName,
        signatureTitle,
        doctorNotes,
      },
      { new: true }
    ).populate("signedBy", "name email role specialty");
    if (!report) return res.status(404).json({ message: "Report not found" });
    res.json({ report });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/bulk/sign", authorize("admin", "doctor"), validate(bulkSignSchema), async (req, res) => {
  try {
    const { ids, doctorNotes } = req.body;
    const roleTitleMap = { doctor: "MD", admin: "Clinic Administrator", nurse: "RN", receptionist: "Receptionist" };
    const titleParts = [];
    if (roleTitleMap[req.user.role]) titleParts.push(roleTitleMap[req.user.role]);
    if (req.user.specialty) titleParts.push(req.user.specialty);
    const signatureTitle = titleParts.length ? titleParts.join(", ") : "";

    const result = await Report.updateMany(
      { _id: { $in: ids }, doctorSigned: false },
      {
        doctorSigned: true,
        signedBy: req.user._id,
        signedAt: new Date(),
        digitalSignature: req.user.name,
        signatureTitle,
        doctorNotes,
      }
    );
    res.json({ modifiedCount: result.modifiedCount });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/bulk/delete", authorize("admin"), validate(bulkDeleteSchema), async (req, res) => {
  try {
    const { ids } = req.body;
    const result = await Report.deleteMany({ _id: { $in: ids } });
    res.json({ deletedCount: result.deletedCount });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete("/:id", authorize("admin"), validate(idParam, "params"), async (req, res) => {
  try {
    await Report.findByIdAndDelete(req.params.id);
    res.json({ message: "Report deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
