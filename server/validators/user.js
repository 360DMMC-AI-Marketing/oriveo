import { z } from "zod";

export const createUserSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["admin", "doctor", "nurse", "receptionist", "staff"]).default("staff"),
  phone: z.string().max(30).optional().or(z.literal("")),
  specialty: z.string().max(100).optional().or(z.literal("")),
  isActive: z.boolean().optional(),
});

export const updateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email("Invalid email").optional(),
  password: z.string().min(6).optional(),
  role: z.enum(["admin", "doctor", "nurse", "receptionist", "staff"]).optional(),
  phone: z.string().max(30).optional().or(z.literal("")),
  specialty: z.string().max(100).optional().or(z.literal("")),
  isActive: z.boolean().optional(),
});
