import { Router } from "express";
import mongoose from "mongoose";
import { protect, authorize } from "../middleware/auth.js";
import { audit } from "../middleware/auditLog.js";
import Prescription from "../models/Prescription.js";
import Patient from "../models/Patient.js";
import PatientDocument from "../models/PatientDocument.js";
import { assertPatientInOrg } from "../utils/tenant.js";
import { documentUpload } from "../middleware/upload.js";
import { runOcr } from "../utils/runOcr.js";
import { extractStructuredFromImage } from "../services/openai.js";
import { extractRxFromText } from "../utils/ocrExtract.js";

const router = Router();

router.use(protect);

router.get("/", async (req, res) => {
  try {
    const filter = { ...req.tenantFilter };
    if (req.query.patient) filter.patient = req.query.patient;
    if (req.query.status) filter.status = req.query.status;
    if (req.user.role === "doctor" || req.user.role === "nurse") {
      const patients = await Patient.find({ assignedDoctor: req.user._id }).select("_id");
      filter.patient = { $in: patients.map((p) => p._id) };
    }
    const prescriptions = await Prescription.find(filter)
      .populate("patient", "name phone")
      .populate("prescribedBy", "name")
      .populate("attachments", "fileName mimeType size")
      .sort({ createdAt: -1 });
    res.json({ prescriptions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/stats", async (req, res) => {
  try {
    const match = { ...req.tenantFilter };
    const [total, active, filled, expired] = await Promise.all([
      Prescription.countDocuments(match),
      Prescription.countDocuments({ ...match, status: "active" }),
      Prescription.countDocuments({ ...match, status: "filled" }),
      Prescription.countDocuments({ ...match, status: "expired" }),
    ]);
    res.json({ total, active, filled, expired });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/:id", audit("prescription.viewed"), async (req, res) => {
  try {
    const prescription = await Prescription.findOne({ _id: req.params.id, ...req.tenantFilter })
      .populate("patient", "name dob gender")
      .populate("prescribedBy", "name title")
      .populate("signedBy", "name title");
    if (!prescription) return res.status(404).json({ message: "Prescription not found" });
    res.json({ prescription });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/scan", authorize("admin", "doctor"), documentUpload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "Image required" });
    const { patient } = req.body;
    if (!patient || !mongoose.Types.ObjectId.isValid(patient)) {
      return res.status(400).json({ message: "Valid patient ID required" });
    }
    if (!(await assertPatientInOrg(req, patient))) {
      return res.status(404).json({ message: "Patient not found" });
    }

    let ocrText = "";
    let draft = null;
    try {
      const ai = await extractStructuredFromImage(req.file.path, req.file.mimetype, "rx");
      if (ai.ok && ai.draft && ai.draft.medication) {
        draft = ai.draft;
      }
    } catch {
      draft = null;
    }
    if (!draft) {
      try {
        const r = await runOcr(req.file.path);
        ocrText = r.ok ? r.text : "";
        draft = ocrText ? extractRxFromText(ocrText) : null;
      } catch {
        draft = null;
      }
    }

    if (draft) {
      const validRoutes = ["oral", "topical", "IV", "IM", "subcutaneous", "inhalation", "ophthalmic", "otic", "rectal", "sublingual"];
      if (draft.route && !validRoutes.includes(draft.route)) draft.route = "";
      if (draft.quantity !== null && draft.quantity !== undefined) draft.quantity = Number(draft.quantity) || null;
      if (draft.refills === null || draft.refills === undefined) draft.refills = 0;
    }

    const doc = await PatientDocument.create({
      patient,
      organization: req.user.organization || null,
      fileName: req.file.filename,
      originalName: req.file.originalname || "scan.jpg",
      mimeType: req.file.mimetype,
      size: req.file.size,
      docType: "Prescription",
      tags: ["scan"],
      ocrText,
      ocrProcessed: !!ocrText,
      uploadedBy: req.user._id,
    });

    res.json({ ok: !!draft, draft, documentId: doc._id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/", authorize("admin", "doctor"), async (req, res) => {
  try {
    const { patient, medication, dosage, route, frequency, instructions, quantity, refills, startDate, endDate, attachments } = req.body;
    if (!patient || !mongoose.Types.ObjectId.isValid(patient)) {
      return res.status(400).json({ message: "Valid patient ID required" });
    }
    if (!medication || !medication.trim()) {
      return res.status(400).json({ message: "Medication name required" });
    }
    if (!(await assertPatientInOrg(req, patient))) {
      return res.status(404).json({ message: "Patient not found" });
    }
    let validAttachments = [];
    if (Array.isArray(attachments) && attachments.length) {
      const docs = await PatientDocument.find({ _id: { $in: attachments }, patient, organization: req.user.organization || null }).select("_id");
      validAttachments = docs.map((d) => d._id);
    }
    const prescription = await Prescription.create({
      organization: req.user.organization,
      patient,
      prescribedBy: req.user._id,
      medication: medication.trim(),
      dosage: dosage || "",
      route: route || "",
      frequency: frequency || "",
      instructions: instructions || "",
      quantity: quantity || null,
      refills: refills || 0,
      startDate: startDate || new Date(),
      endDate: endDate || null,
      createdBy: req.user._id,
      attachments: validAttachments,
    });
    res.status(201).json({ prescription });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/:id", authorize("admin", "doctor"), async (req, res) => {
  try {
    const prescription = await Prescription.findOne({ _id: req.params.id, ...req.tenantFilter });
    if (!prescription) return res.status(404).json({ message: "Prescription not found" });
    const allowed = ["medication", "dosage", "route", "frequency", "instructions", "quantity", "refills", "startDate", "endDate", "status"];
    for (const key of allowed) {
      if (req.body[key] !== undefined) prescription[key] = req.body[key];
    }
    if (Array.isArray(req.body.attachments) && req.body.attachments.length) {
      const docs = await PatientDocument.find({ _id: { $in: req.body.attachments }, patient: prescription.patient, organization: req.user.organization || null }).select("_id");
      prescription.attachments = docs.map((d) => d._id);
    }
    await prescription.save();
    res.json({ prescription });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/:id/sign", authorize("admin", "doctor"), async (req, res) => {
  try {
    const prescription = await Prescription.findOne({ _id: req.params.id, ...req.tenantFilter });
    if (!prescription) return res.status(404).json({ message: "Prescription not found" });
    const signature = req.body.signatureName || req.user.digitalSignature || req.user.name;
    prescription.isSigned = true;
    prescription.signedBy = req.user._id;
    prescription.signedAt = new Date();
    prescription.signatureName = signature;
    await prescription.save();
    res.json({ prescription });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/:id/renew", authorize("admin", "doctor"), async (req, res) => {
  try {
    const original = await Prescription.findOne({ _id: req.params.id, ...req.tenantFilter });
    if (!original) return res.status(404).json({ message: "Prescription not found" });
    const renewed = await Prescription.create({
      organization: original.organization,
      patient: original.patient,
      prescribedBy: req.user._id,
      medication: original.medication,
      dosage: original.dosage,
      route: original.route,
      frequency: original.frequency,
      instructions: original.instructions,
      quantity: original.quantity,
      refills: original.refills,
      startDate: new Date(),
      createdBy: req.user._id,
    });
    original.status = "expired";
    await original.save();
    res.status(201).json({ prescription: renewed });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete("/:id", authorize("admin", "doctor"), async (req, res) => {
  try {
    await Prescription.findOneAndDelete({ _id: req.params.id, ...req.tenantFilter });
    res.json({ message: "Prescription deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
