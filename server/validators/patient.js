import { z } from "zod";

export const createPatientSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  patientType: z.enum(["human", "pet"]).optional(),
  phone: z.string().max(30).optional().nullable().or(z.literal("")),
  email: z.string().email("Invalid email").optional().nullable().or(z.literal("")),
  dob: z.string().optional().nullable().or(z.literal("")),
  gender: z.enum(["male", "female", "other", "intact-male", "neutered", "intact-female", "spayed", ""]).optional().nullable(),
  address: z.string().max(300).optional().nullable().or(z.literal("")),
  primaryDiagnosis: z.string().max(200).optional().nullable().or(z.literal("")),
  chronicConditions: z.string().max(500).optional().nullable().or(z.literal("")),
  currentMedications: z.string().max(500).optional().nullable().or(z.literal("")),
  allergies: z.string().max(500).optional().nullable().or(z.literal("")),
  language: z.string().max(50).optional().nullable().or(z.literal("")),
  assignedDoctor: z.string().optional().nullable().or(z.literal("")),
  kbNotes: z.string().max(2000).optional().nullable().or(z.literal("")),
  species: z.string().max(100).optional().nullable().or(z.literal("")),
  breed: z.string().max(100).optional().nullable().or(z.literal("")),
  weight: z.number().positive().optional().nullable(),
  color: z.string().max(100).optional().nullable().or(z.literal("")),
  microchipId: z.string().max(100).optional().nullable().or(z.literal("")),
  ownerName: z.string().max(100).optional().nullable().or(z.literal("")),
  ownerPhone: z.string().max(30).optional().nullable().or(z.literal("")),
  ownerEmail: z.string().email("Invalid email").optional().nullable().or(z.literal("")),
});

export const updatePatientSchema = createPatientSchema.partial();

export const mongoIdSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, "Invalid ID format"),
});
