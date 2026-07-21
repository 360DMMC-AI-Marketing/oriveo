import Call from "../models/Call.js";
import PatientDocument from "../models/PatientDocument.js";
import AuditLog from "../models/AuditLog.js";
import { logger } from "./logger.js";

let intervalHandle = null;

const RETENTION_DAYS = parseInt(process.env.DATA_RETENTION_DAYS || "365");
const AUDIT_RETENTION_DAYS = parseInt(process.env.AUDIT_RETENTION_DAYS || "730");

export async function enforceRetention() {
  try {
    if (RETENTION_DAYS <= 0) return;

    const callCutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);
    const auditCutoff = new Date(Date.now() - AUDIT_RETENTION_DAYS * 24 * 60 * 60 * 1000);

    const [oldCalls, oldAuditLogs, oldDocs] = await Promise.all([
      Call.deleteMany({ createdAt: { $lt: callCutoff } }),
      AuditLog.deleteMany({ timestamp: { $lt: auditCutoff } }),
      PatientDocument.deleteMany({ createdAt: { $lt: callCutoff } }),
    ]);

    const total = oldCalls.deletedCount + oldAuditLogs.deletedCount + oldDocs.deletedCount;
    if (total > 0) {
      logger.info("dataRetention", `Cleaned up ${total} records (${oldCalls.deletedCount} calls, ${oldAuditLogs.deletedCount} audit logs, ${oldDocs.deletedCount} documents)`);
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
