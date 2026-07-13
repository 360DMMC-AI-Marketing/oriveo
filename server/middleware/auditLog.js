import AuditLog from "../models/AuditLog.js";

export function audit(action) {
  return async (req, res, next) => {
    const originalJson = res.json.bind(res);
    res.json = function (body) {
      const resourceId =
        req.params.id || req.params.patientId || req.params.callId || req.body?._id || "";
      const resourceType = detectResourceType(req.originalUrl);

      if (shouldLog(action, req.method)) {
        const logEntry = new AuditLog({
          action,
          userId: req.user?._id || null,
          userEmail: req.user?.email || "",
          userRole: req.user?.role || "",
          resourceType,
          resourceId,
          description: `${req.method} ${req.originalUrl}`,
          ipAddress: req.ip || req.headers["x-forwarded-for"] || "",
          userAgent: (req.headers["user-agent"] || "").substring(0, 255),
          metadata: {
            statusCode: res.statusCode,
            query: sanitizeForLog(req.query),
          },
        });

        logEntry.save().catch((err) => {
          console.error("Audit log save error:", err.message);
        });
      }

      return originalJson(body);
    };
    next();
  };
}

function detectResourceType(url) {
  if (url.includes("/patients")) return "Patient";
  if (url.includes("/calls")) return "Call";
  if (url.includes("/appointments")) return "Appointment";
  if (url.includes("/questionnaires")) return "Questionnaire";
  if (url.includes("/config") || url.includes("/integrations")) return "Config";
  if (url.includes("/users")) return "User";
  if (url.includes("/groups")) return "Group";
  return null;
}

function shouldLog(action, method) {
  const sensitiveActions = [
    "patient.viewed",
    "patient.updated",
    "patient.created",
    "call.viewed",
    "call.transcript.viewed",
    "ehr.synced",
    "ehr.exported",
  ];
  if (sensitiveActions.includes(action)) return true;
  if (method !== "GET") return true;
  return false;
}

function sanitizeForLog(obj) {
  if (!obj || typeof obj !== "object") return obj;
  const sanitized = {};
  const sensitiveKeys = ["password", "token", "secret", "key", "authorization", "apiKey"];
  for (const [key, value] of Object.entries(obj)) {
    if (sensitiveKeys.some((k) => key.toLowerCase().includes(k))) {
      sanitized[key] = "[REDACTED]";
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

export async function createAuditLog({ action, userId, userEmail, userRole, resourceType, resourceId, description, metadata }) {
  try {
    await AuditLog.create({
      action,
      userId,
      userEmail,
      userRole,
      resourceType,
      resourceId,
      description,
      metadata,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("Audit log error:", error.message);
  }
}