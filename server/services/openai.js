import OpenAI from "openai";

let openai = null;

export function getOpenAI() {
  if (!openai && process.env.OPENAI_API_KEY) {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openai;
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
