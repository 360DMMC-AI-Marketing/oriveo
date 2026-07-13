const FHIR_CONFIG = {
  baseUrl: process.env.FHIR_BASE_URL || "",
  apiKey: process.env.FHIR_API_KEY || "",
  system: process.env.FHIR_SYSTEM || "https://oriveo.ai/fhir",
};

let adapter = null;

export function configureFhir(config) {
  Object.assign(FHIR_CONFIG, config);
}

export function getFhirAdapter() {
  if (!adapter) {
    adapter = new FhirAdapter();
  }
  return adapter;
}

class FhirAdapter {
  async request(path, options = {}) {
    if (!FHIR_CONFIG.baseUrl) {
      console.warn("FHIR_BASE_URL not configured — skipping FHIR request");
      return null;
    }

    const url = `${FHIR_CONFIG.baseUrl.replace(/\/+$/, "")}/${path}`;
    const headers = {
      "Content-Type": "application/fhir+json",
      Accept: "application/fhir+json",
    };
    if (FHIR_CONFIG.apiKey) {
      headers.Authorization = `Bearer ${FHIR_CONFIG.apiKey}`;
    }

    const response = await fetch(url, { ...options, headers });
    if (!response.ok) {
      console.error(`FHIR ${options.method || "GET"} ${url} — ${response.status}`);
      return null;
    }
    return response.json();
  }

  async patientMatch(patientData) {
    const params = new URLSearchParams();
    if (patientData.name) params.append("name", patientData.name);
    if (patientData.phone) params.append("phone", patientData.phone);
    if (patientData.dateOfBirth) params.append("birthdate", patientData.dateOfBirth);
    if (patientData.email) params.append("email", patientData.email);

    const result = await this.request(`Patient/$match?${params.toString()}`, { method: "POST" });
    if (result?.entry?.length > 0) {
      return result.entry[0].resource;
    }
    return null;
  }

  async createPatient(patientData) {
    const patient = {
      resourceType: "Patient",
      identifier: [
        {
          system: FHIR_CONFIG.system,
          value: patientData.externalId || patientData._id?.toString(),
        },
      ],
      name: [
        {
          family: patientData.lastName || patientData.name?.split(" ").slice(1).join(" "),
          given: [patientData.firstName || patientData.name?.split(" ")[0] || ""],
        },
      ],
      telecom: [
        ...(patientData.phone ? [{ system: "phone", value: patientData.phone, use: "mobile" }] : []),
        ...(patientData.email ? [{ system: "email", value: patientData.email }] : []),
      ],
      birthDate: patientData.dateOfBirth || "",
      gender: patientData.gender || "unknown",
      language: patientData.language || "en",
      active: !patientData.doNotCall,
    };

    return this.request("Patient", {
      method: "POST",
      body: JSON.stringify(patient),
    });
  }

  async createAppointment(appointmentData) {
    const appointment = {
      resourceType: "Appointment",
      status: appointmentData.status === "cancelled" ? "cancelled" : "booked",
      description: appointmentData.reason || appointmentData.title || "",
      start: appointmentData.date instanceof Date
        ? appointmentData.date.toISOString()
        : new Date(appointmentData.date).toISOString(),
      participant: [
        {
          actor: {
            identifier: {
              system: FHIR_CONFIG.system,
              value: appointmentData.patient?.toString(),
            },
          },
          status: "accepted",
        },
      ],
    };

    return this.request("Appointment", {
      method: "POST",
      body: JSON.stringify(appointment),
    });
  }

  async createObservation(patientId, code, value, category = "social-history") {
    const observation = {
      resourceType: "Observation",
      status: "final",
      category: [{ coding: [{ system: "http://terminology.hl7.org/CodeSystem/observation-category", code: category }] }],
      code: {
        coding: [{ system: "http://loinc.org", code: code.code, display: code.display }],
        text: code.display,
      },
      subject: {
        identifier: { system: FHIR_CONFIG.system, value: patientId?.toString() },
      },
      valueString: typeof value === "string" ? value : JSON.stringify(value),
      effectiveDateTime: new Date().toISOString(),
    };

    return this.request("Observation", {
      method: "POST",
      body: JSON.stringify(observation),
    });
  }

  async createCarePlan(patientId, callData) {
    const carePlan = {
      resourceType: "CarePlan",
      status: "active",
      intent: "plan",
      subject: {
        identifier: { system: FHIR_CONFIG.system, value: patientId?.toString() },
      },
      description: `AI triage follow-up — Tier ${callData.highestTier} escalation`,
      activity: (callData.redFlags || []).map((flag) => ({
        detail: {
          code: {
            text: `Red flag: ${flag.keyword}`,
          },
          status: "not-done",
          description: flag.text,
        },
      })),
      period: { start: new Date().toISOString() },
    };

    return this.request("CarePlan", {
      method: "POST",
      body: JSON.stringify(carePlan),
    });
  }
}

export { FhirAdapter };
