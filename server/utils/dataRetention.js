import Call from "../models/Call.js";
import PatientDocument from "../models/PatientDocument.js";
import AuditLog from "../models/AuditLog.js";
import { deleteLocalUpload } from "../services/storage.js";
import path from "path";
import { logger } from "./logger.js";

let intervalHandle = null;

const RETENTION_DAYS = parseInt(process.env.DATA_RETENTION_DAYS || "365");
const AUDIT_RETENTION_DAYS = parseInt(process.env.AUDIT_RETENTION_DAYS || "2190");

export async function enforceRetention() {
  try {
    if (RETENTION_DAYS <= 0) return;

    const callCutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);
    const auditCutoff = new Date(Date.now() - AUDIT_RETENTION_DAYS * 24 * 60 * 60 * 1000);

    const oldDocs = await PatientDocument.find({ createdAt: { $lt: callCutoff } }).select("fileName").lean();
    let filesDeleted = 0;
    for (const doc of oldDocs) {
      if (doc.fileName && deleteLocalUpload(path.join("uploads", "documents", path.basename(doc.fileName)))) {
        filesDeleted++;
      }
    }

    const [oldCalls, oldAuditLogs, docsResult] = await Promise.all([
      Call.deleteMany({ createdAt: { $lt: callCutoff } }),
      AuditLog.deleteMany({ timestamp: { $lt: auditCutoff } }),
      PatientDocument.deleteMany({ createdAt: { $lt: callCutoff } }),
    ]);

    const total = oldCalls.deletedCount + oldAuditLogs.deletedCount + docsResult.deletedCount;
    if (total > 0 || filesDeleted > 0) {
      logger.info("dataRetention", `Cleaned up ${total} records (${oldCalls.deletedCount} calls, ${oldAuditLogs.deletedCount} audit logs, ${docsResult.deletedCount} documents) and removed ${filesDeleted} files`);
    }
  } catch (err) {
    logger.error("dataRetention", err.message);
  }
}

export function startDataRetentionScheduler() {
  enforceRetention();
  intervalHandle = setInterval(enforceRetention, 24 * 60 * 60 * 1000);
}

export function stopDataRetentionScheduler() {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
  }
}
