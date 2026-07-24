import mongoose from "mongoose";
import Patient from "../models/Patient.js";
import { addDocument, removeDocument } from "../services/knowledgeBase.js";
import { cacheGet, cacheSet, cacheDel } from "../utils/cache.js";

function syncKbNotes(patient) {
  if (!patient.kbNotes || !patient.kbNotes.trim()) {
    removeDocument(`patient_${patient._id}`);
    return;
  }
  const isPet = patient.patientType === "pet";
  const summary = [
    isPet ? `Pet: ${patient.name}` : `Patient: ${patient.name}`,
    isPet && patient.species ? `Species: ${patient.species}` : "",
    isPet && patient.breed ? `Breed: ${patient.breed}` : "",
    isPet && patient.ownerName ? `Owner: ${patient.ownerName}` : "",
    !isPet && patient.primaryDiagnosis ? `Diagnosis: ${patient.primaryDiagnosis}` : "",
    !isPet && patient.chronicConditions ? `Chronic: ${patient.chronicConditions}` : "",
    patient.allergies ? `Allergies: ${patient.allergies}` : "",
    patient.currentMedications ? `Medications: ${patient.currentMedications}` : "",
    patient.language ? `Language: ${patient.language}` : "",
    `Notes: ${patient.kbNotes}`,
  ].filter(Boolean).join("\n");

  addDocument(`patient_${patient._id}`, isPet ? `Pet: ${patient.name}` : `Patient: ${patient.name}`, summary, {
    type: "patient",
    patientType: patient.patientType,
    patientId: patient._id.toString(),
    patientName: patient.name,
  });
}

export const getPatients = async (req, res) => {
  try {
    const query = { ...req.tenantFilter };
    if (req.query.patientType) {
      query.patientType = req.query.patientType;
    }
    if (req.user.role === "doctor" || req.user.role === "nurse") {
      query.assignedDoctor = req.user._id;
    }
    if (req.query.search) {
      query.$or = [
        { name: { $regex: req.query.search, $options: "i" } },
        { phone: { $regex: req.query.search, $options: "i" } },
        { ownerName: { $regex: req.query.search, $options: "i" } },
        { ownerPhone: { $regex: req.query.search, $options: "i" } },
      ];
    }
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
    const skip = (page - 1) * limit;
    const cacheKey = `patients:${req.user.organization || "default"}:${req.user.role}:${req.user._id}:${page}:${limit}:${req.query.search || ""}:${req.query.patientType || ""}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return res.json(cached);

    const [patients, total] = await Promise.all([
      Patient.find(query)
        .populate("assignedDoctor", "name email")
        .populate("createdBy", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Patient.countDocuments(query),
    ]);
    const result = { patients, total, page, pages: Math.ceil(total / limit) };
    await cacheSet(cacheKey, result, 20);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getPatient = async (req, res) => {
  try {
    const patient = await Patient.findOne({ _id: req.params.id, ...req.tenantFilter })
      .populate("assignedDoctor", "name email phone")
      .populate("createdBy", "name");
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }
    res.json({ patient });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createPatient = async (req, res) => {
  try {
    let orgSpecialty;
    if (req.user.organization) {
      const org = await mongoose.model("Organization").findById(req.user.organization).lean();
      orgSpecialty = org?.specialty;
    }
    const patient = await Patient.create({ ...req.body, createdBy: req.user._id, organization: req.user.organization || null, specialty: req.body.specialty || orgSpecialty || "general" });
    syncKbNotes(patient);
    const populated = await patient.populate("assignedDoctor", "name email");
    await cacheDel("patients:*");
    res.status(201).json({ patient: populated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updatePatient = async (req, res) => {
  try {
    const patient = await Patient.findOneAndUpdate({ _id: req.params.id, ...req.tenantFilter }, req.body, {
      new: true,
      runValidators: true,
    }).populate("assignedDoctor", "name email");
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }
    syncKbNotes(patient);
    await cacheDel("patients:*");
    res.json({ patient });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deletePatient = async (req, res) => {
  try {
    const patient = await Patient.findOneAndDelete({ _id: req.params.id, ...req.tenantFilter });
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }
    removeDocument(`patient_${patient._id}`);
    await cacheDel("patients:*");
    await cacheDel("reports:*");
    res.json({ message: "Patient deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
