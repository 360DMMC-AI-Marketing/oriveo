import Patient from "../models/Patient.js";

export function getTenantFilter(req) {
  return req.tenantFilter || {};
}

export async function patientBelongsToOrg(req, patientId) {
  if (!patientId || !req.user) return false;
  if (req.user.superAdmin) return true;
  const patient = await Patient.exists({ _id: patientId, ...req.tenantFilter });
  return !!patient;
}

export async function assertPatientInOrg(req, patientId) {
  return patientBelongsToOrg(req, patientId);
}
