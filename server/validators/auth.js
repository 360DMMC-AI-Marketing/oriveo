import { z } from "zod";

export const inviteSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email address"),
  role: z.enum(["admin", "doctor", "nurse", "receptionist", "staff"]),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

export const signupSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["admin", "doctor", "nurse", "receptionist", "staff"]).optional(),
  clinicName: z.string().min(1).max(200).optional(),
  clinicSlug: z.string().min(1).max(100).optional(),
  phone: z.string().optional(),
  specialty: z.string().optional(),
});
