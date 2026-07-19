import OpenAI from "openai";
import Report from "../models/Report.js";
import Call from "../models/Call.js";
import Patient from "../models/Patient.js";
import Organization from "../models/Organization.js";
import { getReportTemplate } from "../config/reportTemplates.js";

let openai = null;

function getOpenAI() {
  if (!openai && process.env.OPENAI_API_KEY) {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openai;
}

function buildSpecialtySystemPrompt(specialty, clinicType, template) {
  const sectionsList = (template.sections || []).map((s) => `  "${s.id}": "${s.description}"`).join(",\n");
  const scalesList = (template.assessmentScales || []).map((s) => `  "${s.id}": "${s.label} (${s.description || s.options?.join(", ") || ""})"`).join(",\n");

  return `You are a medical report writer specializing in ${template.label}. Follow ${template.standard}.

Generate a structured medical report in JSON format based on the patient context and call transcript.

The report must follow the ${template.label} specialty format with these sections:
{
${sectionsList}
${template.assessmentScales?.length ? `,\n  "assessmentScales": {\n${scalesList}\n  }` : ""}
${template.clinicType === "dental" ? `,\n  "dentalCharting": "Periodontal charting summary including probing depths, BOP, recession, furcation, mobility for affected teeth (ADA numbering)"` : ""}
${template.clinicType === "veterinary" ? `,\n  "signalment": "Species, breed, age, sex, weight, BCS"` : ""}
${template.clinicType === "veterinary" ? `,\n  "withdrawalTimes": "Drug withdrawal times for meat and milk if applicable"` : ""}
  "keyExchanges": [{ "speaker": "AI/Patient", "text": "important clinical quote" }],
  "nextSteps": ["Recommended actions in order of priority"],
  "callSummary": "One paragraph clinical summary"
}

Clinical requirements:
- Use ICD-10-CM diagnosis codes where applicable
- ${template.clinicType === "dental" ? "Use CDT procedure codes for dental procedures" : "Use CPT procedure codes where applicable"}
- Include relevant risk factors and medical history
- Document all medications with dosages
- Note any allergies or adverse reactions
- Include follow-up recommendations with specific timeframe
- For assessment scales, provide actual scores with interpretation
- For veterinary cases: INCLUDE DRUG WITHDRAWAL TIMES FOR MEAT AND MILK
- For dental cases: USE ADA TOOTH NUMBERING (1-32 permanent, A-T primary)`;
}

export async function generateReport(callId) {
  const call = await Call.findById(callId).populate("patient").populate("startedBy");
  if (!call) throw new Error("Call not found");

  const existing = await Report.findOne({ call: callId });
  if (existing) return existing;

  const client = getOpenAI();
  if (!client) throw new Error("OpenAI not configured");

  const patient = call.patient || {};

  // Determine specialty from patient or organization
  let specialty = patient.specialty || "general-practice";
  let clinicType = "human";
  if (patient.patientType === "pet") clinicType = "veterinary";

  const org = call.organization
    ? await Organization.findById(call.organization).lean()
    : null;
  if (org?.specialty) specialty = org.specialty;
  if (org?.clinicType) clinicType = org.clinicType;

  // For dental specialties, set clinicType
  const dentalSpecialties = ["general-dentistry", "orthodontics", "endodontics", "periodontics", "oral-surgery", "prosthodontics", "pediatric-dentistry"];
  if (dentalSpecialties.includes(specialty)) clinicType = "dental";

  const template = getReportTemplate(specialty);
  const systemPrompt = buildSpecialtySystemPrompt(specialty, clinicType, template);

  const age = patient.dob ? Math.floor((new Date() - new Date(patient.dob)) / 31557600000) : null;

  const transcriptText = (call.transcript || [])
    .map((e) => `${e.question ? `AI: ${e.question}` : ""}${e.answer ? `\nPatient: ${e.answer}` : ""}`)
    .join("\n")
    .slice(0, 8000);

  const patientContext = [
    `Specialty: ${template.label}`,
    `Clinic type: ${clinicType}`,
    `Name: ${patient.name || "Unknown"}`,
    age ? `Age: ${age}` : null,
    patient.gender ? `Gender: ${patient.gender}` : null,
    patient.primaryDiagnosis ? `Diagnosis: ${patient.primaryDiagnosis}` : null,
    patient.chronicConditions ? `Chronic: ${patient.chronicConditions}` : null,
    patient.currentMedications ? `Meds: ${patient.currentMedications}` : null,
    patient.allergies ? `Allergies: ${patient.allergies}` : null,
    patient.species ? `Species: ${patient.species}` : null,
    patient.breed ? `Breed: ${patient.breed}` : null,
    patient.weight ? `Weight: ${patient.weight}` : null,
    call.aiSummary ? `Call purpose: ${call.aiSummary}` : null,
    call.aiSeverityScore != null ? `Severity: ${call.aiSeverityScore}/10` : null,
    call.triageTier ? `Triage tier: ${call.triageTier}` : null,
    call.redFlags?.length ? `Red flags: ${call.redFlags.map((f) => f.keyword).join(", ")}` : null,
  ]
    .filter(Boolean)
    .join(". ");

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `PATIENT CONTEXT:\n${patientContext}\n\nTRANSCRIPT:\n${transcriptText}` },
    ],
    temperature: 0.3,
    max_tokens: 3000,
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
    organization: call.organization,
    specialty,
    clinicType,
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
    aiAssessment: data.aiAssessment || data.assessment || "",
    adviceGiven: data.adviceGiven || data.plan || "",
    medicationsReviewed: data.medicationsReviewed || data.medications || "",
    allergiesFlagged: data.allergiesFlagged || "",
    chronicConditions: data.chronicConditions || data.pmh || "",
    vitalsMentioned: data.vitalsMentioned || "",
    vitals: data.vitals || {},
    physicalExamFindings: data.physicalExam || data.skinExam || data.neuroExam || data.jointExam || data.entExam || data.eyeExam || data.intraoralExam || "",
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
    specialtyData: {
      diagnosisCodes: data.diagnoses || data.diagnosisCodes || [],
      assessmentScales: data.assessmentScales ? Object.entries(data.assessmentScales).map(([k, v]) => ({ scaleId: k, score: String(v) })) : [],
      examFindings: data.examFindings || [],
      imagingFindings: data.imaging || data.radiographs || data.diagnosticTests || "",
      labResults: data.labs || data.laboratory || "",
      proceduresPerformed: data.proceduresPerformed || data.procedure ? [data.procedure] : [],
      treatmentSummary: data.treatmentSummary || data.treatment || data.plan || "",
      followUpRecommendation: data.followUp || data.plan?.followUp || "",
      structuredFields: data.specialtyData || {},
    },
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
