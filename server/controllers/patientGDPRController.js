import Patient from "../models/Patient.js";
import Consent from "../models/Consent.js";
import Call from "../models/Call.js";
import MedicalRecord from "../models/MedicalRecord.js";
import ClinicalNote from "../models/ClinicalNote.js";
import PatientDocument from "../models/PatientDocument.js";
import Appointment from "../models/Appointment.js";
import AuditLog from "../models/AuditLog.js";
import VitalSign from "../models/VitalSign.js";
import BookingToken from "../models/BookingToken.js";
import Notification from "../models/Notification.js";

export async function getConsents(req, res) {
  try {
    const consents = await Consent.find({ patient: req.params.id, ...req.tenantFilter })
      .populate("grantedBy", "name email")
      .sort({ createdAt: -1 });
    res.json({ consents });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

export async function setConsent(req, res) {
  try {
    const { type, granted } = req.body;
    if (!type) return res.status(400).json({ message: "type is required" });

    const patient = await Patient.findOne({ _id: req.params.id, ...req.tenantFilter });
    if (!patient) return res.status(404).json({ message: "Patient not found" });

    const existing = await Consent.findOne({
      patient: req.params.id,
      type,
      granted: true,
      revokedAt: null,
    });

    if (existing && granted) {
      return res.json({ consent: existing, message: "Consent already granted" });
    }

    if (existing && !granted) {
      existing.revokedAt = new Date();
      await existing.save();
    }

    const consent = await Consent.create({
      patient: req.params.id,
      organization: req.user.organization || null,
      type,
      granted,
      ipAddress: req.ip || req.headers["x-forwarded-for"] || "",
      userAgent: (req.headers["user-agent"] || "").substring(0, 255),
      grantedBy: req.user._id,
      source: "staff",
    });

    res.status(granted ? 201 : 200).json({ consent });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

export async function erasePatient(req, res) {
  try {
    const patient = await Patient.findOne({ _id: req.params.id, ...req.tenantFilter });
    if (!patient) return res.status(404).json({ message: "Patient not found" });

    const patientId = patient._id;

    const calls = await Call.find({ patient: patientId });
    const audioUrls = calls.map((c) => c.audioUrl).filter(Boolean);

    const results = await Promise.all([
      Patient.deleteOne({ _id: patientId }),
      Call.deleteMany({ patient: patientId }),
      MedicalRecord.deleteMany({ patient: patientId }),
      ClinicalNote.deleteMany({ patient: patientId }),
      PatientDocument.deleteMany({ patient: patientId }),
      Appointment.deleteMany({ patient: patientId }),
      VitalSign.deleteMany({ patient: patientId }),
      BookingToken.deleteMany({ patient: patientId }),
      Notification.deleteMany({ patient: patientId }),
      Consent.deleteMany({ patient: patientId }),
      AuditLog.deleteMany({ resourceType: "Patient", resourceId: patientId.toString() }),
    ]);

    res.json({
      message: "Patient and all associated data permanently deleted",
      deleted: {
        patient: results[0].deletedCount,
        calls: results[1].deletedCount,
        medicalRecords: results[2].deletedCount,
        clinicalNotes: results[3].deletedCount,
        documents: results[4].deletedCount,
        appointments: results[5].deletedCount,
        vitals: results[6].deletedCount,
        bookingTokens: results[7].deletedCount,
        notifications: results[8].deletedCount,
        consents: results[9].deletedCount,
        auditLogs: results[10].deletedCount,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

export async function exportPatientData(req, res) {
  try {
    const patient = await Patient.findOne({ _id: req.params.id, ...req.tenantFilter })
      .populate("assignedDoctor", "name email")
      .populate("createdBy", "name email")
      .lean();

    if (!patient) return res.status(404).json({ message: "Patient not found" });

    const [calls, medicalRecords, clinicalNotes, appointments, vitals, consents] =
      await Promise.all([
        Call.find({ patient: req.params.id }).lean(),
        MedicalRecord.find({ patient: req.params.id }).populate("doctor", "name").lean(),
        ClinicalNote.find({ patient: req.params.id }).populate("createdBy", "name").lean(),
        Appointment.find({ patient: req.params.id }).lean(),
        VitalSign.find({ patient: req.params.id }).sort({ recordedAt: -1 }).lean(),
        Consent.find({ patient: req.params.id }).lean(),
      ]);

    const exportData = {
      exportedAt: new Date().toISOString(),
      exportedBy: req.user.email,
      formatVersion: "1.0",
      patient,
      calls: calls.map((c) => ({
        id: c._id,
        direction: c.direction,
        status: c.status,
        duration: c.duration,
        startedAt: c.startedAt,
        endedAt: c.endedAt,
        aiSeverityScore: c.aiSeverityScore,
        triageTier: c.triageTier,
        emergencyDetected: c.emergencyDetected,
        language: c.language,
        consentRecorded: c.consentRecorded,
      })),
      medicalRecords,
      clinicalNotes,
      appointments,
      vitals,
      consents,
    };

    res.json(exportData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}
