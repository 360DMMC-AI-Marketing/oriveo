import { Router } from "express";
import multer from "multer";
import { parse } from "csv-parse/sync";
import bcrypt from "bcryptjs";
import Patient from "../models/Patient.js";
import Organization from "../models/Organization.js";
import { documentUpload } from "../middleware/upload.js";
import {
  getPatients,
  getPatient,
  createPatient,
  updatePatient,
  deletePatient,
} from "../controllers/patientController.js";
import {
  getUnifiedPatient,
  createMedicalRecord,
  deleteMedicalRecord,
  uploadDocument,
  deleteDocument,
  addVitalSign,
  getVitalSigns,
  searchDocuments,
} from "../controllers/patientExtendedController.js";
import { protect, authorize } from "../middleware/auth.js";
import { audit } from "../middleware/auditLog.js";
import { validate } from "../middleware/validate.js";
import { createPatientSchema, updatePatientSchema } from "../validators/patient.js";
import {
  getConsents,
  setConsent,
  erasePatient,
  exportPatientData,
} from "../controllers/patientGDPRController.js";

function csvFileFilter(req, file, cb) {
  if (file.mimetype === "text/csv" || file.mimetype === "application/csv" || file.mimetype === "application/vnd.ms-excel" || file.originalname.toLowerCase().endsWith(".csv")) {
    return cb(null, true);
  }
  const err = new Error(`File type not allowed (${file.mimetype}). Allowed: PDF, images, plain text, CSV, and Office documents.`);
  err.isOperational = true;
  err.statusCode = 400;
  return cb(err);
}

const csvUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 }, fileFilter: csvFileFilter });

const router = Router();

router.use(protect);

router.get("/", getPatients);
router.get("/search/documents", searchDocuments);
router.get("/:id/unified", audit("patient.viewed"), getUnifiedPatient);
router.get("/:id/vitals", getVitalSigns);
router.get("/:id", audit("patient.viewed"), getPatient);

router.post("/:id/portal", authorize("admin", "doctor"), async (req, res) => {
  try {
    const { password, enabled } = req.body;
    const patient = await Patient.findOne({ _id: req.params.id, organization: req.user.organization });
    if (!patient) return res.status(404).json({ message: "Patient not found" });
    if (password) {
      if (String(password).length < 6) return res.status(400).json({ message: "Password must be at least 6 characters" });
      patient.portalPassword = await bcrypt.hash(String(password), 10);
      patient.portalEnabled = true;
    }
    if (enabled !== undefined) patient.portalEnabled = Boolean(enabled);
    await patient.save();
    res.json({ message: "Portal access updated", portalEnabled: patient.portalEnabled });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
router.post("/import", authorize("admin"), csvUpload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "CSV file required" });
    const raw = req.file.buffer.toString("utf-8");
    const records = parse(raw, { columns: true, skip_empty_lines: true, trim: true });
    if (records.length === 0) return res.status(400).json({ message: "CSV file is empty" });
    const results = { imported: 0, skipped: 0, errors: [] };
    let orgSpecialty = "general-practice";
    if (req.user.organization) {
      const org = await Organization.findById(req.user.organization).lean();
      if (org?.specialty) orgSpecialty = org.specialty;
    }
    for (const row of records) {
      try {
        if (!row.name || !row.phone) { results.skipped++; results.errors.push(`Row ${results.imported + results.skipped}: name and phone required`); continue; }
        delete row.specialty;
        await Patient.create({ ...row, organization: req.user.organization || null, createdBy: req.user._id, specialty: orgSpecialty });
        results.imported++;
      } catch (err) {
        results.skipped++;
        results.errors.push(`Row ${results.imported + results.skipped}: ${err.message}`);
      }
    }
    res.status(201).json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
router.post("/:id/records", authorize("admin", "doctor"), createMedicalRecord);
router.post("/:id/documents", authorize("admin", "doctor", "nurse"), documentUpload.single("file"), uploadDocument);
router.post("/:id/vitals", authorize("admin", "doctor", "nurse"), addVitalSign);
router.post("/", authorize("admin", "doctor", "receptionist"), validate(createPatientSchema), audit("patient.created"), createPatient);
router.put("/:id", authorize("admin", "doctor", "nurse"), validate(updatePatientSchema), audit("patient.updated"), updatePatient);
router.delete("/:id/records/:rid", authorize("admin", "doctor"), deleteMedicalRecord);
router.delete("/:id/documents/:did", authorize("admin", "doctor"), deleteDocument);
router.delete("/:id", authorize("admin"), audit("patient.deleted"), deletePatient);

router.get("/:id/consents", authorize("admin", "doctor"), getConsents);
router.post("/:id/consents", authorize("admin", "doctor"), setConsent);

router.delete("/:id/erasure", authorize("admin"), audit("patient.erased"), erasePatient);

router.get("/:id/export", authorize("admin", "doctor"), audit("patient.exported"), exportPatientData);

export default router;
