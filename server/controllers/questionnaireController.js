import Questionnaire from "../models/Questionnaire.js";
import OpenAI from "openai";

let openai = null;
function getOpenAI() {
  if (!openai && process.env.OPENAI_API_KEY) {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openai;
}

export const getQuestionnaires = async (req, res) => {
  try {
    const query = {};
    if (req.query.category) query.category = req.query.category;
    if (req.query.language) query.language = req.query.language;
    const questionnaires = await Questionnaire.find(query)
      .populate("createdBy", "name")
      .sort({ createdAt: -1 });
    res.json({ questionnaires });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getQuestionnaire = async (req, res) => {
  try {
    const questionnaire = await Questionnaire.findById(req.params.id)
      .populate("createdBy", "name");
    if (!questionnaire) {
      return res.status(404).json({ message: "Questionnaire not found" });
    }
    res.json({ questionnaire });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createQuestionnaire = async (req, res) => {
  try {
    const questionnaire = await Questionnaire.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json({ questionnaire });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateQuestionnaire = async (req, res) => {
  try {
    const questionnaire = await Questionnaire.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!questionnaire) {
      return res.status(404).json({ message: "Questionnaire not found" });
    }
    res.json({ questionnaire });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteQuestionnaire = async (req, res) => {
  try {
    const questionnaire = await Questionnaire.findByIdAndDelete(req.params.id);
    if (!questionnaire) {
      return res.status(404).json({ message: "Questionnaire not found" });
    }
    res.json({ message: "Questionnaire deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const generateQuestions = async (req, res) => {
  try {
    const { condition, language, category } = req.body;
    if (!condition) {
      return res.status(400).json({ message: "Condition is required" });
    }
    const client = getOpenAI();
    if (!client) {
      return res.status(503).json({ message: "AI service not configured. Set OPENAI_API_KEY in .env" });
    }
    const prompt = `Generate a medical questionnaire for a patient with the following condition: "${condition}".
Category: ${category || "general"}
Language: ${language || "English"}

Create 8-12 questions that a doctor would ask during a phone assessment. 
Mix of question types: "open" (open-ended), "scale" (1-10 rating), and "yesno" (yes/no).

Return as a JSON array of objects with fields: text, type (one of: open, scale, yesno).

Only return the JSON array, nothing else.`;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });

    const content = completion.choices[0].message.content;
    const cleaned = content.replace(/```json|```/g, "").trim();
    const questions = JSON.parse(cleaned);

    const formatted = questions.map((q, i) => ({
      text: q.text,
      type: q.type || "open",
      order: i + 1,
      followUp: "",
    }));

    res.json({ questions: formatted });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
