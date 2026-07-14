import { Router } from "express";
import multer from "multer";
import { parse } from "csv-parse/sync";
import path from "path";
import fs from "fs";
import Patient from "../models/Patient.js";
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
import { validate } from "../middleware/validate.js";
import { createPatientSchema, updatePatientSchema } from "../validators/patient.js";

const docDir = "uploads/documents";
fs.mkdirSync(docDir, { recursive: true });

const documentStorage = multer.diskStorage({
  destination: docDir,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});

const csvUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
const documentUpload = multer({ storage: documentStorage, limits: { fileSize: 20 * 1024 * 1024 } });

const router = Router();

router.use(protect);

router.get("/", getPatients);
router.get("/search/documents", searchDocuments);
router.get("/:id/unified", getUnifiedPatient);
router.get("/:id/vitals", getVitalSigns);
router.get("/:id", getPatient);
router.post("/import", authorize("admin"), csvUpload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "CSV file required" });
    const raw = req.file.buffer.toString("utf-8");
    const records = parse(raw, { columns: true, skip_empty_lines: true, trim: true });
    if (records.length === 0) return res.status(400).json({ message: "CSV file is empty" });
    const results = { imported: 0, skipped: 0, errors: [] };
    for (const row of records) {
      try {
        if (!row.name || !row.phone) { results.skipped++; results.errors.push(`Row ${results.imported + results.skipped}: name and phone required`); continue; }
        await Patient.create({ ...row, organization: req.user.organization || null, createdBy: req.user._id });
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
router.post("/", authorize("admin", "doctor", "receptionist"), validate(createPatientSchema), createPatient);
router.put("/:id", authorize("admin", "doctor", "nurse"), validate(updatePatientSchema), updatePatient);
router.delete("/:id/records/:rid", authorize("admin", "doctor"), deleteMedicalRecord);
router.delete("/:id/documents/:did", authorize("admin", "doctor"), deleteDocument);
router.delete("/:id", authorize("admin"), deletePatient);

export default router;
