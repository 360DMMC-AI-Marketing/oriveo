import Patient from "../models/Patient.js";
import MedicalRecord from "../models/MedicalRecord.js";
import PatientDocument from "../models/PatientDocument.js";
import VitalSign from "../models/VitalSign.js";
import Call from "../models/Call.js";
import Appointment from "../models/Appointment.js";
import Report from "../models/Report.js";
import { autoTagDocument } from "../utils/ocrDictionaries.js";
import { createWorker } from "tesseract.js";
import fs from "fs";
import path from "path";

export const getUnifiedPatient = async (req, res) => {
  try {
    const patient = await Patient.findOne({ _id: req.params.id, ...req.tenantFilter })
      .populate("assignedDoctor", "name email phone")
      .populate("createdBy", "name");
    if (!patient) return res.status(404).json({ message: "Patient not found" });

    const [records, documents, vitals, calls, appointments, reports] = await Promise.all([
      MedicalRecord.find({ patient: req.params.id, isActive: true }).sort({ date: -1 }).populate("doctor", "name").populate("createdBy", "name"),
      PatientDocument.find({ patient: req.params.id }).sort({ createdAt: -1 }),
      VitalSign.find({ patient: req.params.id }).sort({ recordedAt: -1 }).limit(50),
      Call.find({ patient: req.params.id }).sort({ createdAt: -1 }).limit(10).populate("questionnaire", "title"),
      Appointment.find({ patient: req.params.id }).sort({ date: -1 }).limit(10).populate("bookedBy", "name"),
      Report.find({ patient: req.params.id }).sort({ createdAt: -1 }).limit(10).populate("signedBy", "name"),
    ]);

    res.json({ patient, records, documents, vitals, calls, appointments, reports });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createMedicalRecord = async (req, res) => {
  try {
    const record = await MedicalRecord.create({
      ...req.body,
      patient: req.params.id,
      organization: req.user.organization || null,
      createdBy: req.user._id,
    });
    const populated = await record.populate("doctor", "name");
    res.status(201).json({ record: populated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteMedicalRecord = async (req, res) => {
  try {
    const record = await MedicalRecord.findOneAndUpdate(
      { _id: req.params.rid, patient: req.params.id, organization: req.user.organization || null },
      { isActive: false },
      { new: true }
    );
    if (!record) return res.status(404).json({ message: "Record not found" });
    res.json({ message: "Record deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const uploadDocument = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "File required" });

    let ocrText = "";
    let docType = "other";
    let tags = [];

    if (req.file.mimetype === "application/pdf" || req.file.mimetype.startsWith("image/")) {
      try {
        const worker = await createWorker("eng");
        const { data: { text } } = await worker.recognize(req.file.buffer);
        await worker.terminate();
        ocrText = text || "";
        const auto = autoTagDocument(ocrText);
        docType = auto.type;
        tags = auto.tags;
      } catch {
        ocrText = "";
      }
    }

    const doc = await PatientDocument.create({
      patient: req.params.id,
      organization: req.user.organization || null,
      fileName: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      docType,
      tags,
      ocrText,
      ocrProcessed: !!ocrText,
      uploadedBy: req.user._id,
    });

    res.status(201).json({ document: doc });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteDocument = async (req, res) => {
  try {
    const doc = await PatientDocument.findOneAndDelete({
      _id: req.params.did,
      patient: req.params.id,
      organization: req.user.organization || null,
    });
    if (!doc) return res.status(404).json({ message: "Document not found" });
    const safeName = path.basename(doc.fileName);
    const filePath = path.join("uploads", "documents", safeName);
    const resolvedPath = path.resolve(filePath);
    const documentsDir = path.resolve("uploads", "documents");
    if (!resolvedPath.startsWith(documentsDir + path.sep)) {
      return res.status(400).json({ message: "Invalid file path" });
    }
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    res.json({ message: "Document deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const addVitalSign = async (req, res) => {
  try {
    const vital = await VitalSign.create({
      ...req.body,
      patient: req.params.id,
      organization: req.user.organization || null,
      recordedBy: req.user._id,
    });
    res.status(201).json({ vital });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getVitalSigns = async (req, res) => {
  try {
    const query = { patient: req.params.id, organization: req.user.organization || null };
    if (req.query.from || req.query.to) {
      query.recordedAt = {};
      if (req.query.from) query.recordedAt.$gte = new Date(req.query.from);
      if (req.query.to) query.recordedAt.$lte = new Date(req.query.to);
    }
    const vitals = await VitalSign.find(query).sort({ recordedAt: -1 }).limit(100).populate("recordedBy", "name");
    res.json({ vitals });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const searchDocuments = async (req, res) => {
  try {
    const query = { organization: req.user.organization || null };
    if (req.query.q) {
      query.$text = { $search: req.query.q };
    }
    const docs = await PatientDocument.find(query)
      .populate("patient", "name phone")
      .populate("uploadedBy", "name")
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ documents: docs });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
