const TRIAGE_SNOMED = {
  0: { code: "4525004", display: "Emergency", severity: "24484000" },
  1: { code: "64915003", display: "Urgent", severity: "6736007" },
  2: { code: "103705002", display: "Semi-urgent", severity: "371923003" },
  3: { code: "103706001", display: "Non-urgent", severity: "371924009" },
  4: { code: "262202000", display: "Routine", severity: "399166001" },
};

const SEVERITY_SNOMED = {
  mild:     { code: "255604002", display: "Mild" },
  moderate: { code: "6736007",   display: "Moderate" },
  severe:   { code: "24484000",  display: "Severe" },
};

const CONDITION_MAP = {
  "chest pain": "29857009",
  "shortness of breath": "267036007",
  "headache": "25064002",
  "fever": "386661006",
  "cough": "49727002",
  "nausea": "422587007",
  "dizziness": "386173000",
  "fatigue": "84229001",
  "abdominal pain": "21522001",
  "back pain": "161891005",
  "anxiety": "197480006",
  "depression": "35489007",
  "hypertension": "59621000",
  "diabetes": "73211009",
  "asthma": "195967001",
  "allergy": "609328004",
};

function findSnomedCode(text) {
  if (!text) return null;
  const lower = text.toLowerCase().trim();
  for (const [key, code] of Object.entries(CONDITION_MAP)) {
    if (lower.includes(key)) return { code, display: text };
  }
  return null;
}

function buildIdentifier(reportId) {
  return {
    system: "https://oriveo.io/reports",
    value: reportId.toString(),
  };
}

function buildCodeableConcept(code, display, system = "http://snomed.info/sct") {
  return {
    coding: [{ system, code, display }],
    text: display,
  };
}

export function convertReportToFhirBundle(report, baseUrl = "https://oriveo.io/fhir") {
  const id = report._id.toString();
  const patientRef = report.patient?._id
    ? { reference: `Patient/${report.patient._id}`, display: report.patient.name }
    : null;
  const practitionerRef = report.generatedBy?._id || report.generatedBy
    ? { reference: `Practitioner/${report.generatedBy?._id || report.generatedBy}`, display: report.generatedBy?.name || "AI Assistant" }
    : null;
  const now = new Date().toISOString();
  const reportDate = report.callDate || report.createdAt || now;

  const entries = [];

  // ─── ClinicalImpression ───────────────────────────────
  const triageInfo = TRIAGE_SNOMED[report.triageLevel] || TRIAGE_SNOMED[3];
  const clinicalImpression = {
    fullUrl: `${baseUrl}/ClinicalImpression/${id}`,
    resource: {
      resourceType: "ClinicalImpression",
      id,
      status: "completed",
      description: report.chiefComplaint || "AI-generated clinical impression",
      subject: patientRef,
      encounter: report.call?._id ? { reference: `Encounter/${report.call._id}` } : undefined,
      date: reportDate,
      assessor: practitionerRef,
      summary: report.callSummary || report.aiAssessment,
      prognosisCodeableConcept: report.triageLevel !== undefined
        ? [buildCodeableConcept(triageInfo.code, triageInfo.display)]
        : undefined,
      finding: (report.redFlags || []).map((flag, i) => ({
        itemCodeableConcept: buildCodeableConcept(
          findSnomedCode(flag)?.code || "404684003",
          flag
        ),
        basis: `Red flag #${i + 1}`,
      })),
      note: report.aiAssessment
        ? [{ text: report.aiAssessment }]
        : undefined,
    },
  };
  entries.push(clinicalImpression);

  // ─── Condition (red flags + chronic conditions) ────────
  for (const flag of report.redFlags || []) {
    const snomed = findSnomedCode(flag);
    entries.push({
      fullUrl: `${baseUrl}/Condition/${id}-rf-${entries.length}`,
      resource: {
        resourceType: "Condition",
        id: `${id}-rf-${entries.length}`,
        clinicalStatus: { coding: [{ system: "http://terminology.hl7.org/CodeSystem/condition-clinical", code: "active" }] },
        verificationStatus: { coding: [{ system: "http://terminology.hl7.org/CodeSystem/condition-ver-status", code: "confirmed" }] },
        code: buildCodeableConcept(snomed?.code || "404684003", flag),
        subject: patientRef,
        severity: buildCodeableConcept(triageInfo.severity, triageInfo.display),
        recordedDate: reportDate,
        note: [{ text: `Flagged as red flag during AI triage call` }],
      },
    });
  }

  if (report.chronicConditions) {
    const snomed = findSnomedCode(report.chronicConditions);
    entries.push({
      fullUrl: `${baseUrl}/Condition/${id}-chronic`,
      resource: {
        resourceType: "Condition",
        id: `${id}-chronic`,
        clinicalStatus: { coding: [{ system: "http://terminology.hl7.org/CodeSystem/condition-clinical", code: "active" }] },
        verificationStatus: { coding: [{ system: "http://terminology.hl7.org/CodeSystem/condition-ver-status", code: "confirmed" }] },
        code: buildCodeableConcept(snomed?.code || "404684003", report.chronicConditions),
        subject: patientRef,
        recordedDate: reportDate,
      },
    });
  }

  // ─── Observations (symptoms, vitals) ──────────────────
  for (const symptom of report.symptomsCaptured || []) {
    const sev = SEVERITY_SNOMED[symptom.severity?.toLowerCase()] || null;
    const snomed = findSnomedCode(symptom.symptom);
    entries.push({
      fullUrl: `${baseUrl}/Observation/${id}-sym-${entries.length}`,
      resource: {
        resourceType: "Observation",
        id: `${id}-sym-${entries.length}`,
        status: "final",
        code: buildCodeableConcept(snomed?.code || "404684003", symptom.symptom),
        subject: patientRef,
        effectiveDateTime: reportDate,
        valueCodeableConcept: sev ? buildCodeableConcept(sev.code, sev.display) : undefined,
        interpretation: symptom.severity === "severe"
          ? [{ coding: [{ system: "http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation", code: "H" }], text: "High" }]
          : undefined,
      },
    });
  }

  if (report.vitalsMentioned) {
    entries.push({
      fullUrl: `${baseUrl}/Observation/${id}-vitals`,
      resource: {
        resourceType: "Observation",
        id: `${id}-vitals`,
        status: "final",
        code: { coding: [{ system: "http://loinc.org", code: "8867-4", display: "Vital signs" }], text: "Vitals mentioned" },
        subject: patientRef,
        effectiveDateTime: reportDate,
        valueString: report.vitalsMentioned,
      },
    });
  }

  // ─── DiagnosticReport ──────────────────────────────────
  entries.push({
    fullUrl: `${baseUrl}/DiagnosticReport/${id}`,
    resource: {
      resourceType: "DiagnosticReport",
      id,
      status: "final",
      code: { coding: [{ system: "http://loinc.org", code: "34753-6", display: "Call summary note" }], text: "AI Call Report" },
      subject: patientRef,
      encounter: report.call?._id ? { reference: `Encounter/${report.call._id}` } : undefined,
      effectiveDateTime: reportDate,
      issued: now,
      performer: practitionerRef ? [practitionerRef] : undefined,
      conclusion: report.callSummary || report.aiAssessment,
      conclusionCode: report.triageLevel !== undefined
        ? [buildCodeableConcept(triageInfo.code, triageInfo.display)]
        : undefined,
      presentedForm: report._id
        ? [{ url: `${baseUrl}/Report/${id}/pdf`, title: "AI Call Report PDF" }]
        : undefined,
    },
  });

  // ─── DocumentReference ─────────────────────────────────
  entries.push({
    fullUrl: `${baseUrl}/DocumentReference/${id}`,
    resource: {
      resourceType: "DocumentReference",
      id,
      status: "current",
      type: { coding: [{ system: "http://loinc.org", code: "34753-6", display: "Call summary note" }], text: "AI Call Report" },
      subject: patientRef,
      author: practitionerRef ? [practitionerRef] : undefined,
      indexed: now,
      date: reportDate,
      description: `AI-generated call report for ${report.patient?.name || "patient"}`,
      content: [{
        attachment: {
          contentType: "application/json",
          url: `${baseUrl}/Report/${id}/fhir`,
          title: "FHIR Bundle",
        },
        format: {
          system: "http://ihe.net/fhir/formatcode",
          code: "urn:ihe:iti:xds:2017:mimeTypeSufficient",
          display: "FHIR Bundle",
        },
      }],
      context: {
        period: {
          start: reportDate,
          end: reportDate,
        },
        practiceSetting: { coding: [{ system: "http://snomed.info/sct", code: "394814009", display: "General practice" }] },
      },
    },
  });

  return {
    resourceType: "Bundle",
    id: `oriveo-report-${id}`,
    type: "document",
    timestamp: now,
    identifier: buildIdentifier(id),
    entry: entries,
  };
}

export function convertReportToFhirConditionSummary(report) {
  const triageInfo = TRIAGE_SNOMED[report.triageLevel] || TRIAGE_SNOMED[3];
  return {
    resourceType: "Condition",
    id: report._id?.toString(),
    code: buildCodeableConcept(triageInfo.code, triageInfo.display),
    severity: buildCodeableConcept(triageInfo.severity, triageInfo.display),
    note: [{
      text: [
        report.chiefComplaint && `Chief complaint: ${report.chiefComplaint}`,
        report.aiAssessment,
        report.callSummary,
      ].filter(Boolean).join("\n"),
    }],
  };
}
