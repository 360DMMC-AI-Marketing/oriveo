import { Router } from "express";
import { protect } from "../middleware/auth.js";
import { clinicalQuery } from "../services/clinicalSupport.js";
import { suggestCptCode, getCptCodeInfo } from "../services/medicalCoding.js";
import { SPECIALTY_TEMPLATES, getSpecialtyForKeywords } from "../config/specialtyTemplates.js";
import Patient from "../models/Patient.js";
import Call from "../models/Call.js";
import ClinicalNote from "../models/ClinicalNote.js";
import { generateLiveNoteChunk, finalizeNote } from "../services/ambientNoteGenerator.js";
import { buildPatientInfo } from "../services/mediaStreamCommon.js";
import {
  getClinicalNotes,
  createClinicalNote,
  getClinicalNote,
  updateClinicalNote,
  deleteClinicalNote,
  signClinicalNote,
  getClinicalTemplates,
  createClinicalTemplate,
  searchIcd10,
} from "../controllers/clinicalController.js";

const router = Router();

router.use(protect);

// Ambient note generation from transcript
router.post("/ambient/generate", async (req, res) => {
  try {
    const { transcript, previousNote, patientId, specialty, clinicType } = req.body;
    if (!transcript?.trim()) return res.status(400).json({ message: "Transcript is required" });
    let patientContext = "";
    if (patientId) {
      const patient = await Patient.findById(patientId).lean();
      if (patient) patientContext = buildPatientInfo(patient);
    }
    const note = await generateLiveNoteChunk({
      transcriptSoFar: transcript,
      previousNote: previousNote || null,
      patientContext,
      specialty: specialty || "general-practice",
      clinicType: clinicType || "human",
    });
    res.json({ note });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Finalize ambient note from a completed call
router.post("/ambient/finalize", async (req, res) => {
  try {
    const { transcript, patientId, specialty, clinicType, callId } = req.body;
    if (!transcript?.trim()) return res.status(400).json({ message: "Transcript is required" });
    let patientContext = "";
    if (patientId) {
      const patient = await Patient.findById(patientId).lean();
      if (patient) patientContext = buildPatientInfo(patient);
    }
    const finalData = await finalizeNote({
      transcriptFull: transcript,
      patientContext,
      specialty: specialty || "general-practice",
      clinicType: clinicType || "human",
      callId: callId || null,
    });
    if (finalData && patientId) {
      try {
        await ClinicalNote.create({
          patient: patientId,
          specialty: specialty || "general-practice",
          clinicType: clinicType || "human",
          encounterDate: new Date(),
          encounterType: "phone",
          subjective: finalData.subjective || "",
          objective: finalData.objective || "",
          assessment: finalData.assessment || "",
          plan: finalData.plan || "",
          diagnoses: finalData.diagnoses || [],
          vitals: finalData.vitals || {},
          createdBy: req.user?._id,
        });
      } catch (noteErr) {
        console.error("[ambient] ClinicalNote save error:", noteErr.message);
      }
    }
    res.json({ note: finalData });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// AI clinical query
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

// CPT coding
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

// Specialty detection
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

// ICD-10 search
router.get("/icd10", searchIcd10);

// Clinical templates
router.get("/templates", getClinicalTemplates);
router.post("/templates", createClinicalTemplate);

// Clinical notes (under /api/clinical/patients/:patientId/notes)
router.get("/patients/:id/notes", getClinicalNotes);
router.post("/patients/:id/notes", createClinicalNote);
router.get("/patients/:id/notes/:noteId", getClinicalNote);
router.put("/patients/:id/notes/:noteId", updateClinicalNote);
router.delete("/patients/:id/notes/:noteId", deleteClinicalNote);
router.post("/patients/:id/notes/:noteId/sign", signClinicalNote);

export default router;
