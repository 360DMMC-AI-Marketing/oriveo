import mongoose from "mongoose";

let baseUrl = process.env.ATHENA_BASE_URL || "";
let apiKey = process.env.ATHENA_API_KEY || "";
let apiSecret = process.env.ATHENA_API_SECRET || "";
let practiceId = process.env.ATHENA_PRACTICE_ID || "";

export function configureAthena(config) {
  if (config.ATHENA_BASE_URL) baseUrl = config.ATHENA_BASE_URL;
  if (config.ATHENA_API_KEY) apiKey = config.ATHENA_API_KEY;
  if (config.ATHENA_API_SECRET) apiSecret = config.ATHENA_API_SECRET;
  if (config.ATHENA_PRACTICE_ID) practiceId = config.ATHENA_PRACTICE_ID;
}

export function isAthenaConfigured() {
  return !!(baseUrl && apiKey && apiSecret && practiceId);
}

function getAuth() {
  return Buffer.from(`${apiKey}:${apiSecret}`).toString("base64");
}

let accessToken = null;
let tokenExpires = 0;

async function getToken() {
  if (accessToken && Date.now() < tokenExpires) return accessToken;
  const res = await fetch(`${baseUrl}/oauth2/v1/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${getAuth()}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ grant_type: "client_credentials" }),
  });
  if (!res.ok) throw new Error(`athenahealth auth failed: ${res.status}`);
  const data = await res.json();
  accessToken = data.access_token;
  tokenExpires = Date.now() + (data.expires_in - 60) * 1000;
  return accessToken;
}

async function api(path, options = {}) {
  const token = await getToken();
  const url = `${baseUrl}/${practiceId}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`athenahealth API error ${res.status}: ${text}`);
  }
  return res.json();
}

export async function getPatients(search) {
  const params = new URLSearchParams();
  if (search) params.set("searchterm", search);
  params.set("limit", "100");
  return api(`/patients?${params}`);
}

export async function getPatient(patientId) {
  return api(`/patients/${patientId}`);
}

export async function getAppointments(departmentId, startDate, endDate) {
  const params = new URLSearchParams({
    departmentid: departmentId,
    startdate: startDate,
    enddate: endDate,
    limit: "100",
  });
  return api(`/appointments/booked?${params}`);
}

export async function createAppointment(patientId, departmentId, appointmentTypeId, date, time) {
  return api(`/appointments`, {
    method: "POST",
    body: JSON.stringify({
      patientid: patientId,
      departmentid: departmentId,
      appointmenttypeid: appointmentTypeId,
      appointmentdate: date,
      appointmenttime: time,
    }),
  });
}

export async function getDepartments() {
  return api("/departments");
}

export async function getAppointmentTypes(departmentId) {
  return api(`/appointmenttypes?departmentid=${departmentId}`);
}

export async function writeClinicalNote(patientId, noteText) {
  return api(`/patients/${patientId}/documents`, {
    method: "POST",
    body: JSON.stringify({
      documenttype: "CLINICAL_NOTE",
      content: noteText,
      description: "AI-generated call summary",
    }),
  });
}
