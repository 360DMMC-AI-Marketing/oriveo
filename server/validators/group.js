import { z } from "zod";

export const createGroupSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  description: z.string().max(1000).optional().or(z.literal("")),
  patientIds: z.array(z.string().regex(/^[a-f\d]{24}$/i)).optional(),
});

export const updateGroupSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional().or(z.literal("")),
  patientIds: z.array(z.string().regex(/^[a-f\d]{24}$/i)).optional(),
});

export const addMemberSchema = z.object({
  patientId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid patient ID"),
});

export const callGroupSchema = z.object({
  questionnaire: z.string().regex(/^[a-f\d]{24}$/i).optional().nullable(),
  language: z.string().max(20).optional(),
  notes: z.string().max(2000).optional(),
});
