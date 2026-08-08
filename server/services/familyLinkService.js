import crypto from "crypto";
import BookingToken from "../models/BookingToken.js";
import { sendFamilyLinkEmail } from "./emailService.js";

const LINK_VALID_DAYS = 30;

export function familyLinkBaseUrl(req) {
  return process.env.CLIENT_URL || `${req.protocol}://${req.get("host")}`;
}

export async function generateFamilyLinkToken({ patientId, organizationId }) {
  const existing = await BookingToken.findOne({
    patient: patientId,
    organization: organizationId,
    used: false,
    expiresAt: { $gt: new Date() },
  }).sort({ createdAt: -1 });
  if (existing) return { token: existing.token, fresh: false };

  const record = await BookingToken.create({
    patient: patientId,
    organization: organizationId,
    token: crypto.randomBytes(24).toString("hex"),
    expiresAt: new Date(Date.now() + LINK_VALID_DAYS * 24 * 60 * 60 * 1000),
  });
  return { token: record.token, fresh: true };
}

export async function generateAndEmailFamilyLink({ patient, organizationId, baseUrl }) {
  const { token, fresh } = await generateFamilyLinkToken({ patientId: patient._id, organizationId });
  const familyLink = `${baseUrl}/family/${token}`;
  if (!patient?.familyEmail) {
    return { sent: false, reason: "No family email on patient record — link copied for manual sharing", familyLink };
  }
  if (!fresh) {
    return { sent: false, reason: "A valid family link already exists for this patient (not re-sent)", familyLink };
  }
  const result = await sendFamilyLinkEmail({
    toEmail: patient.familyEmail,
    toName: patient.name,
    patientName: patient.name,
    familyLink,
  });
  return { sent: result.sent, reason: result.reason || "", familyLink };
}
