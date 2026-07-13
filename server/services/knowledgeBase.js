import OpenAI from "openai";
import KnowledgeDoc from "../models/KnowledgeDoc.js";

let openai = null;

function getOpenAI() {
  if (!openai && process.env.OPENAI_API_KEY) {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openai;
}

export async function addDocument(id, title, content, metadata = {}) {
  const chunks = chunkContent(content);
  const docs = chunks.map((chunk, i) => ({
    docId: id,
    title,
    content: chunk,
    metadata,
    chunkIndex: i,
  }));
  await KnowledgeDoc.insertMany(docs);
  return chunks.length;
}

export async function removeDocument(id) {
  const result = await KnowledgeDoc.deleteMany({ docId: id });
  return result.deletedCount || 0;
}

export async function clearDocuments() {
  const result = await KnowledgeDoc.deleteMany({});
  return result.deletedCount || 0;
}

export async function getDocuments() {
  const docs = await KnowledgeDoc.aggregate([
    { $group: { _id: "$docId", title: { $first: "$title" }, metadata: { $first: "$metadata" }, chunkCount: { $sum: 1 } } },
    { $project: { _id: 0, id: "$_id", title: 1, metadata: 1, chunkCount: 1 } },
  ]);
  return docs;
}

function chunkContent(text, maxChunkSize = 800) {
  const sentences = text.match(/[^.!?\n]+[.!?\n]*/g) || [text];
  const chunks = [];
  let current = "";

  for (const sentence of sentences) {
    if ((current + sentence).length > maxChunkSize && current) {
      chunks.push(current.trim());
      current = sentence;
    } else {
      current += sentence;
    }
  }

  if (current.trim()) {
    chunks.push(current.trim());
  }

  return chunks.length > 0 ? chunks : [text];
}

async function getEmbedding(text) {
  const client = getOpenAI();
  if (!client) return null;

  try {
    const response = await client.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
    });
    return response.data[0].embedding;
  } catch {
    return null;
  }
}

function cosineSimilarity(a, b) {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export async function queryKnowledgeBase(query, topK = 3) {
  const docCount = await KnowledgeDoc.countDocuments();
  if (docCount === 0) return null;

  const queryEmbedding = await getEmbedding(query);
  if (!queryEmbedding) {
    return keywordSearch(query, topK);
  }

  const allDocs = await KnowledgeDoc.find({});
  const embedded = [];
  for (const doc of allDocs) {
    const emb = await getEmbedding(doc.content);
    if (emb) {
      embedded.push({ ...doc.toObject(), embedding: emb });
    }
  }

  if (embedded.length === 0) {
    return keywordSearch(query, topK);
  }

  const scored = embedded.map((doc) => ({
    ...doc,
    score: cosineSimilarity(queryEmbedding, doc.embedding),
  }));

  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, topK);

  if (top[0]?.score < 0.3) {
    return keywordSearch(query, topK);
  }

  return top
    .filter((d) => d.score > 0.3)
    .map((d) => `[${d.title}] ${d.content}`)
    .join("\n\n");
}

async function keywordSearch(query, topK = 3) {
  const terms = query.toLowerCase().split(/\s+/).filter((t) => t.length > 2);
  if (terms.length === 0) return null;

  const allDocs = await KnowledgeDoc.find({});
  const scored = allDocs.map((doc) => {
    const lower = doc.content.toLowerCase();
    const titleLower = doc.title.toLowerCase();
    let score = 0;
    for (const term of terms) {
      if (titleLower.includes(term)) score += 3;
      if (lower.includes(term)) score += 1;
    }
    return { ...doc.toObject(), score };
  });

  scored.sort((a, b) => b.score - a.score);
  const top = scored.filter((d) => d.score > 0).slice(0, topK);

  return top.length > 0
    ? top.map((d) => `[${d.title}] ${d.content}`).join("\n\n")
    : null;
}
