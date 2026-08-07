import OpenAI from "openai";
import fs from "node:fs";

let openai = null;

export function getOpenAI() {
  if (!openai && process.env.OPENAI_API_KEY) {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openai;
}

const EXTRACT_PROMPTS = {
  labs: {
    system: `You are a medical data extraction engine. Read the lab report image and extract every test into structured JSON. Respond ONLY with JSON, no markdown. Format: {"panel": string (e.g. "CBC", "CMP", "Lipid Panel", "HbA1c", or "General"), "tests": [{"name": string, "value": string, "unit": string, "referenceLow": string, "referenceHigh": string}], "notes": string}. Use empty string when a field is missing. Keep test names and units exactly as printed on the report.`,
  },
  rx: {
    system: `You are a medical data extraction engine. Read the prescription image and extract structured JSON. Respond ONLY with JSON, no markdown. Format: {"medication": string, "dosage": string, "route": string (one of: oral, topical, IV, IM, subcutaneous, inhalation, ophthalmic, otic, rectal, sublingual; empty string if unknown), "frequency": string, "instructions": string, "quantity": number or null, "refills": number}. Use empty string / null when a field is missing.`,
  },
};

export async function extractStructuredFromImage(filePath, mimeType, kind) {
  const client = getOpenAI();
  if (!client) return { ok: false, error: "OpenAI not configured" };
  const prompt = EXTRACT_PROMPTS[kind];
  if (!prompt) return { ok: false, error: "Unknown extraction kind" };
  try {
    const b64 = fs.readFileSync(filePath).toString("base64");
    const dataUrl = `data:${mimeType || "image/jpeg"};base64,${b64}`;
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: prompt.system },
        {
          role: "user",
          content: [
            { type: "text", text: "Extract the structured data from this image." },
            { type: "image_url", image_url: { url: dataUrl } },
          ],
        },
      ],
      temperature: 0.1,
      response_format: { type: "json_object" },
    });
    const raw = completion.choices[0].message.content || "";
    const parsed = JSON.parse(raw);
    return { ok: true, draft: parsed };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

export async function generateSummary(transcript, language = "en") {
  const client = getOpenAI();
  if (!client) {
    return { summary: "", severityScore: null, error: "OpenAI not configured" };
  }
  try {
    const transcriptText = transcript
      .map((t) => `Q: ${t.question}\nA: ${t.answer}`)
      .join("\n\n");

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a medical AI assistant. Analyze the following patient call transcript.
Provide:
1. A brief medical summary (2-3 sentences)
2. A severity score from 1-10 (10 being most urgent)

Format as JSON: { "summary": "...", "severityScore": number }`,
        },
        { role: "user", content: transcriptText },
      ],
      temperature: 0.3,
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(completion.choices[0].message.content);
    return {
      summary: result.summary || "",
      severityScore: result.severityScore || null,
      error: null,
    };
  } catch (error) {
    return { summary: "", severityScore: null, error: error.message };
  }
}
