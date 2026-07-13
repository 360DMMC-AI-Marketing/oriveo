import { z } from "zod";

export const createCallSchema = z.object({
  patient: z.string().regex(/^[a-f\d]{24}$/i, "Invalid patient ID"),
  questionnaire: z.string().regex(/^[a-f\d]{24}$/i, "Invalid questionnaire ID").optional().nullable(),
  language: z.string().max(20).optional(),
  scheduledFor: z.string().optional(),
  notes: z.string().max(2000).optional(),
  customQuestions: z.array(z.string()).optional(),
});

export const updateCallSchema = z.object({
  patient: z.string().regex(/^[a-f\d]{24}$/i).optional(),
  language: z.string().max(20).optional(),
  notes: z.string().max(2000).optional(),
  status: z.enum(["scheduled", "in-progress", "completed", "failed", "cancelled"]).optional(),
  scheduledFor: z.string().optional(),
  customQuestions: z.array(z.string()).optional(),
});

export const updateCallStatusSchema = z.object({
  status: z.enum(["scheduled", "in-progress", "completed", "failed", "cancelled", "no-answer", "busy"]),
});

export const transferCallSchema = z.object({
  reason: z.string().min(1, "Reason is required").max(500),
  target: z.string().max(100).optional(),
});
