import { z } from "zod";

const questionSchema = z.object({
  text: z.string().min(1, "Question text is required").max(500),
  type: z.enum(["text", "boolean", "scale", "choice", "multi_choice"]).default("text"),
  options: z.array(z.string()).optional(),
  required: z.boolean().default(true),
  order: z.number().int().min(0).optional(),
});

export const createQuestionnaireSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  description: z.string().max(1000).optional().or(z.literal("")),
  questions: z.array(questionSchema).min(1, "At least one question is required"),
  isDefault: z.boolean().optional(),
  language: z.string().max(20).optional(),
});

export const updateQuestionnaireSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional().or(z.literal("")),
  questions: z.array(questionSchema).min(1).optional(),
  isDefault: z.boolean().optional(),
  language: z.string().max(20).optional(),
});
