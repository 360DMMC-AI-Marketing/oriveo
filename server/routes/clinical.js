import { Router } from "express";
import { protect } from "../middleware/auth.js";
import { clinicalQuery } from "../services/clinicalSupport.js";
import { suggestCptCode, getCptCodeInfo } from "../services/medicalCoding.js";
import { SPECIALTY_TEMPLATES, getSpecialtyForKeywords } from "../config/specialtyTemplates.js";
import Patient from "../models/Patient.js";
import Call from "../models/Call.js";

const router = Router();

router.use(protect);

router.post("/query", async (req, res) => {
  try {
    const { question, patientId, callId } = req.body;
    if (!question || !question.trim()) {
      return res.status(400).json({ message: "Question is required" });
    }

    const context = {};

    if (patientId) {
      const patient = await Patient.findById(patientId).lean();
      if (patient) {
        context.patientInfo = {
          name: patient.name,
          age: patient.age,
          gender: patient.gender,
          language: patient.language,
          primaryDiagnosis: patient.primaryDiagnosis,
          chronicConditions: patient.chronicConditions,
          allergies: patient.allergies,
          currentMedications: patient.currentMedications,
        };
      }
    }

    if (callId) {
      const call = await Call.findById(callId).populate("patient", "name").lean();
      if (call) {
        context.callContext = `Call severity: ${call.aiSeverityScore}/10, triage: ${call.triageLevel}, status: ${call.status}, chief complaint: ${call.chiefComplaint || "N/A"}`;
      }
    }

    const result = await clinicalQuery(question.trim(), context);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/coding", async (req, res) => {
  try {
    const { callId, triageLevel, durationSeconds, callType } = req.body;
    let level = triageLevel;
    let duration = durationSeconds;
    let type = callType || "phone";

    if (callId) {
      const call = await Call.findById(callId).lean();
      if (call) {
        level = call.aiSeverityScore != null ? Math.round(call.aiSeverityScore / 2.5) : call.triageLevel;
        duration = call.duration;
      }
    }

    const suggestion = suggestCptCode(level != null ? level : 3, duration, type);
    res.json({ suggestion });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/specialties", (req, res) => {
  const list = Object.entries(SPECIALTY_TEMPLATES).map(([key, t]) => ({
    id: key,
    label: t.label,
    keywords: t.keywords.slice(0, 5),
  }));
  res.json({ specialties: list });
});

router.post("/detect-specialty", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ message: "Text is required" });
    const specialty = getSpecialtyForKeywords(text);
    const template = specialty ? SPECIALTY_TEMPLATES[specialty] : null;
    res.json({ specialty, label: template?.label || "General" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
