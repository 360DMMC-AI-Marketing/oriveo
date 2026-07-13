import { Router } from "express";
import multer from "multer";
import { parse } from "csv-parse/sync";
import Patient from "../models/Patient.js";
import {
  getPatients,
  getPatient,
  createPatient,
  updatePatient,
  deletePatient,
} from "../controllers/patientController.js";
import { protect, authorize } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { createPatientSchema, updatePatientSchema } from "../validators/patient.js";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
const router = Router();

router.use(protect);
router.get("/", getPatients);
router.post("/import", authorize("admin"), upload.single("file"), async (req, res) => {
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
router.get("/:id", getPatient);
router.post("/", authorize("admin", "doctor", "receptionist"), validate(createPatientSchema), createPatient);
router.put("/:id", authorize("admin", "doctor", "nurse"), validate(updatePatientSchema), updatePatient);
router.delete("/:id", authorize("admin"), deletePatient);

export default router;
