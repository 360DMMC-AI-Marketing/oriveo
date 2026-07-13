import OpenAI from "openai";
import { withRetry } from "./queue.js";

let openai = null;

function getOpenAI() {
  if (!openai && process.env.OPENAI_API_KEY) {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openai;
}

const QA_SYSTEM_PROMPT = `You are a healthcare QA evaluator. Analyze this AI-to-patient call transcript and score it on 5 metrics (1-100):

1. accuracy: Did the AI give correct medical information, avoid hallucinations, and stay within scope?
2. empathy: Was the tone warm, compassionate, and patient-centered?
3. professionalism: Was the language appropriate, clear, and respectful?
4. adherence: Did the AI follow the questionnaire/script and complete the call objectives?
5. resolution: Was the call objective achieved (appointment scheduled, info gathered, issue resolved)?

Return JSON only:
{
  "scores": { "accuracy": number, "empathy": number, "professionalism": number, "adherence": number, "resolution": number },
  "overall": number,
  "strengths": ["..."],
  "weaknesses": ["..."],
  "summary": "2-3 sentence evaluation"
}`;

export async function scoreCall(callId, transcript = [], aiSummary = "") {
  const client = getOpenAI();
  if (!client) {
    return { error: "OpenAI not configured" };
  }

  const transcriptText = transcript.length > 0
    ? transcript.map((t, i) => `Turn ${i + 1}:\nQ: ${t.question || ""}\nA: ${t.answer || ""}`).join("\n\n")
    : aiSummary || "No transcript available";

  try {
    const completion = await withRetry("score-call", () => client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: QA_SYSTEM_PROMPT },
        { role: "user", content: transcriptText },
      ],
      temperature: 0.3,
      response_format: { type: "json_object" },
    }), { retries: 2, backoff: 1000 });

    const result = JSON.parse(completion.choices[0].message.content);
    return {
      scores: result.scores || {},
      overall: result.overall || 0,
      strengths: result.strengths || [],
      weaknesses: result.weaknesses || [],
      summary: result.summary || "",
      scoredAt: new Date().toISOString(),
      error: null,
    };
  } catch (error) {
    return { error: error.message };
  }
}

export async function batchScoreCalls(calls) {
  const results = [];
  for (const call of calls) {
    const score = await scoreCall(call._id, call.transcript, call.aiSummary);
    results.push({ callId: call._id, ...score });
  }
  return results;
}
