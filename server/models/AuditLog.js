import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    enum: [
      "patient.viewed",
      "patient.updated",
      "patient.created",
      "patient.deleted",
      "patient.erased",
      "patient.exported",
      "call.viewed",
      "call.transcript.viewed",
      "call.recorded",
      "call.transferred",
      "report.viewed",
      "report.exported",
      "lab.viewed",
      "prescription.viewed",
      "clinicalNote.viewed",
      "clinicalNote.created",
      "clinicalNote.updated",
      "ehr.synced",
      "ehr.exported",
      "settings.changed",
      "user.login",
      "user.logout",
      "api.access",
    ],
  },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  userEmail: { type: String, default: "" },
  userRole: { type: String, default: "" },
  resourceType: {
    type: String,
    enum: ["Patient", "Call", "Appointment", "Questionnaire", "Config", "User", "Group", "Report", "LabResult", "Prescription", "ClinicalNote"],
    default: null,
  },
  resourceId: { type: String, default: null },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", default: null },
  description: { type: String, default: "" },
  ipAddress: { type: String, default: "" },
  userAgent: { type: String, default: "" },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  timestamp: { type: Date, default: Date.now },
  deleted: { type: Boolean, default: false },
});

auditLogSchema.index({ timestamp: -1 });
auditLogSchema.index({ userId: 1, timestamp: -1 });
auditLogSchema.index({ resourceType: 1, resourceId: 1 });
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ userId: 1, action: 1 });
auditLogSchema.index({ action: 1, timestamp: -1 });
auditLogSchema.index({ organization: 1, timestamp: -1 });

export default mongoose.model("AuditLog", auditLogSchema);