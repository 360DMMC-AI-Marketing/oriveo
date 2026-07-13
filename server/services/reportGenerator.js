import OpenAI from "openai";
import Report from "../models/Report.js";
import Call from "../models/Call.js";
import Patient from "../models/Patient.js";

let openai = null;

function getOpenAI() {
  if (!openai && process.env.OPENAI_API_KEY) {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openai;
}

const REPORT_SYSTEM_PROMPT = `You are a medical report writer. Given a call transcript with patient context, generate a structured medical report in JSON format.

Return ONLY valid JSON (no markdown, no backticks):
{
  "chiefComplaint": "Patient's main reason for calling (1-2 sentences)",
  "symptomsCaptured": [{ "symptom": "symptom name", "severity": "mild/moderate/severe" }],
  "redFlags": ["List any critical or urgent findings"],
  "triageLevel": number (0=emergency, 1=urgent, 2=semi-urgent, 3=non-urgent, 4=routine),
  "triageLabel": "Emergency/Urgent/Semi-urgent/Non-urgent/Routine",
  "aiAssessment": "AI's medical assessment of the situation (2-3 sentences)",
  "adviceGiven": "What advice the AI provided to the patient",
  "medicationsReviewed": "Medications discussed or reviewed during the call",
  "allergiesFlagged": "Allergies mentioned or flagged",
  "chronicConditions": "Chronic conditions relevant to this call",
  "vitalsMentioned": "Any vitals or measurements mentioned by the patient",
  "keyExchanges": [{ "speaker": "AI/Patient", "text": "important quote" }],
  "nextSteps": ["Recommended actions"],
  "callSummary": "One paragraph clinical summary of the entire call"
}`;

export async function generateReport(callId) {
  const call = await Call.findById(callId).populate("patient").populate("startedBy");
  if (!call) throw new Error("Call not found");

  const existing = await Report.findOne({ call: callId });
  if (existing) return existing;

  const client = getOpenAI();
  if (!client) throw new Error("OpenAI not configured");

  const patient = call.patient || {};
  const age = patient.dob ? Math.floor((new Date() - new Date(patient.dob)) / 31557600000) : null;

  const transcriptText = (call.transcript || [])
    .map((e) => `${e.question ? `AI: ${e.question}` : ""}${e.answer ? `\nPatient: ${e.answer}` : ""}`)
    .join("\n")
    .slice(0, 8000);

  const patientContext = [
    `Name: ${patient.name || "Unknown"}`,
    age ? `Age: ${age}` : null,
    patient.gender ? `Gender: ${patient.gender}` : null,
    patient.primaryDiagnosis ? `Diagnosis: ${patient.primaryDiagnosis}` : null,
    patient.chronicConditions ? `Chronic: ${patient.chronicConditions}` : null,
    patient.currentMedications ? `Meds: ${patient.currentMedications}` : null,
    patient.allergies ? `Allergies: ${patient.allergies}` : null,
    call.summary ? `Call purpose: ${call.summary}` : null,
    call.triageTier ? `Triage tier: ${call.triageTier}` : null,
    call.redFlags?.length ? `Red flags: ${call.redFlags.map((f) => f.keyword).join(", ")}` : null,
  ]
    .filter(Boolean)
    .join(". ");

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: REPORT_SYSTEM_PROMPT },
      { role: "user", content: `PATIENT CONTEXT:\n${patientContext}\n\nTRANSCRIPT:\n${transcriptText}` },
    ],
    temperature: 0.3,
    max_tokens: 2000,
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("Empty AI response");

  let data;
  try {
    data = JSON.parse(content);
  } catch {
    throw new Error("Failed to parse AI report JSON");
  }

  const qaScore = call.qaScore || {};

  const report = await Report.create({
    call: call._id,
    patient: patient._id || call.patient,
    generatedBy: call.startedBy?._id,
    patientInfo: {
      name: patient.name,
      age,
      gender: patient.gender,
      phone: patient.phone,
    },
    chiefComplaint: data.chiefComplaint || "",
    symptomsCaptured: data.symptomsCaptured || [],
    redFlags: data.redFlags || call.redFlags?.map((f) => f.keyword) || [],
    triageLevel: data.triageLevel ?? call.triageTier ?? 3,
    triageLabel: data.triageLabel || "",
    aiAssessment: data.aiAssessment || "",
    adviceGiven: data.adviceGiven || "",
    medicationsReviewed: data.medicationsReviewed || "",
    allergiesFlagged: data.allergiesFlagged || "",
    chronicConditions: data.chronicConditions || "",
    vitalsMentioned: data.vitalsMentioned || "",
    keyExchanges: data.keyExchanges || [],
    nextSteps: data.nextSteps || [],
    callSummary: data.callSummary || call.aiSummary || "",
    aiQaScores: {
      accuracy: qaScore.scores?.accuracy,
      empathy: qaScore.scores?.empathy,
      professionalism: qaScore.scores?.professionalism,
      adherence: qaScore.scores?.adherence,
      resolution: qaScore.scores?.resolution,
      overall: qaScore.overall,
    },
    callDuration: call.duration,
    callDate: call.startedAt || call.createdAt,
  });

  return report;
}

export async function generateAllMissingReports() {
  const calls = await Call.find({
    status: "completed",
    _id: { $nin: (await Report.find({}).distinct("call")) },
  }).populate("patient");

  const results = [];
  for (const call of calls) {
    try {
      const report = await generateReport(call._id);
      results.push({ callId: call._id, status: "ok", reportId: report._id });
    } catch (err) {
      results.push({ callId: call._id, status: "error", error: err.message });
    }
  }
  return results;
}
