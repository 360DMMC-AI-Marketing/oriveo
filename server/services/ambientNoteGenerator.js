import OpenAI from "openai";
import { getReportTemplate } from "../config/reportTemplates.js";

let openai = null;

function getOpenAI() {
  if (!openai && process.env.OPENAI_API_KEY) {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openai;
}

function buildAmbientSystemPrompt(specialty, clinicType, template, hasPreviousNote) {
  const sectionsList = (template.sections || []).map((s) => `  "${s.id}": "${s.description}"`).join(",\n");

  return `You are a real-time clinical note writer specializing in ${template.label} (${template.standard}).

You are generating a clinical note INCREMENTALLY as a conversation progresses. 

${hasPreviousNote
  ? "A previous version of this note already exists below. Update it by ADDING any new clinical information from the latest transcript chunk. Do NOT repeat what was already captured. Only add NEW findings, symptoms, assessments, or plan changes."
  : "Generate the initial clinical note from the conversation transcript so far."
}

Output JSON with these fields:
{
  "subjective": "Patient-reported symptoms, history, concerns (HPI format)",
  "objective": "Objective findings, vitals, exam data mentioned",
  "assessment": "Clinical assessment, differential diagnoses, severity",
  "plan": "Treatment plan, advice given, follow-up recommendations",
  "diagnoses": [{ "code": "ICD-10-CM code", "name": "Diagnosis name", "laterality": "left/right/bilateral" }],
  "vitals": { "bpSystolic": null, "bpDiastolic": null, "heartRate": null, "temperature": null, "weight": null, "spo2": null, "respiratoryRate": null, "painScore": null },
  "suggestedCptCodes": [{ "code": "CPT code", "description": "Procedure description" }],
  "suggestedIcd10Codes": [{ "code": "ICD-10-CM", "description": "Diagnosis" }],
  "gaps": ["Clinical information still needed — questions the clinician should ask"]
}

${template.clinicType === "dental" ? 'Use CDT codes for procedures. Use ADA tooth numbering (1-32 permanent, A-T primary).' : ''}
${template.clinicType === "veterinary" ? 'Include species-specific findings. Note drug withdrawal times if mentioned.' : ''}

Sections to populate based on this specialty:
{
${sectionsList}
}

Keep responses concise and clinical. If information for a field isn't available yet, leave it as an empty string or null.`;
}

function buildAmbientPrompt(transcriptSoFar, previousNote, patientContext) {
  const parts = [];

  if (patientContext) {
    parts.push(`PATIENT CONTEXT:\n${patientContext}`);
  }

  if (previousNote) {
    parts.push(`CURRENT NOTE (update this with new information):\n${JSON.stringify(previousNote, null, 2)}`);
  }

  const transcriptPreview = transcriptSoFar.slice(-8000);
  parts.push(`LATEST CONVERSATION TRANSCRIPT:\n${transcriptPreview}`);

  return parts.join("\n\n---\n\n");
}

export async function generateLiveNoteChunk({ transcriptSoFar, previousNote, patientContext, specialty, clinicType }) {
  const client = getOpenAI();
  if (!client) return null;

  const template = getReportTemplate(specialty) || { label: specialty, sections: [], standard: "SOAP" };

  if (!transcriptSoFar?.trim()) return previousNote || null;

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: buildAmbientSystemPrompt(specialty, clinicType, template, !!previousNote),
        },
        {
          role: "user",
          content: buildAmbientPrompt(transcriptSoFar, previousNote, patientContext),
        },
      ],
      temperature: 0.2,
      max_tokens: 2000,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return previousNote || null;

    const data = JSON.parse(content);

    return {
      subjective: data.subjective || previousNote?.subjective || "",
      objective: data.objective || previousNote?.objective || "",
      assessment: data.assessment || previousNote?.assessment || "",
      plan: data.plan || previousNote?.plan || "",
      diagnoses: data.diagnoses || previousNote?.diagnoses || [],
      vitals: { ...(previousNote?.vitals || {}), ...(data.vitals || {}) },
      suggestedCptCodes: data.suggestedCptCodes || previousNote?.suggestedCptCodes || [],
      suggestedIcd10Codes: data.suggestedIcd10Codes || previousNote?.suggestedIcd10Codes || [],
      gaps: data.gaps || [],
    };
  } catch (err) {
    console.error(`[ambientNoteGenerator] Error:`, err.message);
    return previousNote || null;
  }
}

export async function finalizeNote({ transcriptFull, patientContext, specialty, clinicType, callId }) {
  const client = getOpenAI();
  if (!client) return null;

  const template = getReportTemplate(specialty) || { label: specialty, sections: [], standard: "SOAP" };
  const transcriptPreview = (transcriptFull || "").slice(-10000);

  if (!transcriptPreview.trim()) return null;

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a clinical note writer specializing in ${template.label} (${template.standard}).

Generate a COMPLETE, FINAL clinical note from the full conversation transcript.

Output JSON with these fields:
{
  "subjective": "Complete HPI — patient-reported symptoms, history, concerns",
  "objective": "Complete objective findings — vitals, exam data, observations",
  "assessment": "Complete clinical assessment — diagnoses, severity, clinical reasoning",
  "plan": "Complete treatment plan — advice, medications, follow-up, referrals",
  "diagnoses": [{ "code": "ICD-10-CM code", "name": "Diagnosis name", "laterality": "" }],
  "vitals": { "bpSystolic": null, "bpDiastolic": null, "heartRate": null, "temperature": null, "weight": null, "spo2": null, "respiratoryRate": null, "painScore": null },
  "suggestedCptCodes": [{ "code": "CPT", "description": "Procedure" }],
  "suggestedIcd10Codes": [{ "code": "ICD-10-CM", "description": "Diagnosis" }],
  "callSummary": "One-paragraph clinical summary of the encounter"
}

${template.clinicType === "dental" ? 'Use CDT codes. Use ADA tooth numbering.' : ''}
${template.clinicType === "veterinary" ? 'Include species, breed, weight. Note withdrawal times if applicable.' : ''}
Be thorough but concise. Use proper clinical terminology.`,
        },
        {
          role: "user",
          content: `PATIENT CONTEXT:\n${patientContext || "Not available"}\n\nFULL TRANSCRIPT:\n${transcriptPreview}`,
        },
      ],
      temperature: 0.2,
      max_tokens: 2500,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return null;

    return JSON.parse(content);
  } catch (err) {
    console.error(`[ambientNoteGenerator:finalize] Error:`, err.message);
    return null;
  }
}
