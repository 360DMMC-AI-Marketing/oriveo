import { z } from "zod";

export const createPatientSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  phone: z.string().min(1, "Phone is required").max(30),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  dob: z.string().optional().or(z.literal("")),
  gender: z.enum(["male", "female", "other", ""]).optional(),
  address: z.string().max(300).optional().or(z.literal("")),
  primaryDiagnosis: z.string().max(200).optional().or(z.literal("")),
  chronicConditions: z.string().max(500).optional().or(z.literal("")),
  currentMedications: z.string().max(500).optional().or(z.literal("")),
  allergies: z.string().max(500).optional().or(z.literal("")),
  language: z.string().max(50).optional().or(z.literal("")),
  assignedDoctor: z.string().optional().or(z.literal("")),
  kbNotes: z.string().max(2000).optional().or(z.literal("")),
});

export const updatePatientSchema = createPatientSchema.partial();

export const mongoIdSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, "Invalid ID format"),
});
