import OpenAI from "openai";
import { queryKnowledgeBase } from "./knowledgeBase.js";
import { withRetry } from "./queue.js";

let openai = null;

function getOpenAI() {
  if (!openai && process.env.OPENAI_API_KEY) {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openai;
}

export async function clinicalQuery(question, context = {}) {
  const client = getOpenAI();
  if (!client) {
    return { answer: "OpenAI not configured", sources: [] };
  }

  const kbResults = await queryKnowledgeBase(question, 5);
  const sources = [];

  let systemPrompt = `You are a clinical decision support assistant. Answer the clinician's question based on the provided medical knowledge base context.`;
  systemPrompt += `\n- Always cite your sources from the context provided.`;
  systemPrompt += `\n- If the context doesn't contain enough information, say so clearly.`;
  systemPrompt += `\n- Do not make up medical advice not supported by the context.`;
  systemPrompt += `\n- Use plain language that a clinician can understand.`;
  systemPrompt += `\n- If the question concerns an emergency, immediately advise calling emergency services.`;

  let userMessage = `Question: ${question}`;

  if (kbResults) {
    userMessage += `\n\nKnowledge base context:\n${kbResults}`;
    const sourceMatches = kbResults.match(/\[([^\]]+)\]/g);
    if (sourceMatches) {
      sourceMatches.forEach((s) => {
        const name = s.replace(/[\[\]]/g, "");
        if (!sources.includes(name)) sources.push(name);
      });
    }
  } else {
    userMessage += `\n\nNo knowledge base results found for this query. Answer based on general medical knowledge, but clearly state this is not from your organization's knowledge base.`;
  }

  if (context.patientInfo) {
    userMessage += `\n\nPatient context: ${JSON.stringify(context.patientInfo)}`;
  }
  if (context.callContext) {
    userMessage += `\n\nCall context: ${context.callContext}`;
  }

  try {
    const response = await withRetry("ai-chat", () => client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      max_tokens: 1000,
      temperature: 0.3,
    }), { retries: 2, backoff: 1000 });

    const answer = response.choices[0]?.message?.content || "No response generated.";
    return { answer, sources };
  } catch (error) {
    return { answer: `Error: ${error.message}`, sources: [] };
  }
}
