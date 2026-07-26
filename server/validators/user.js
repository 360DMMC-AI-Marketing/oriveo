import { z } from "zod";

export const createUserSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  role: z.enum(["admin", "doctor", "nurse", "receptionist"]).default("receptionist"),
  phone: z.string().max(30).optional().or(z.literal("")),
  specialty: z.string().max(100).optional().or(z.literal("")),
  isActive: z.boolean().optional(),
});

export const updateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email("Invalid email").optional(),
  password: z.string().min(8)
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .optional(),
  role: z.enum(["admin", "doctor", "nurse", "receptionist"]).optional(),
  phone: z.string().max(30).optional().or(z.literal("")),
  specialty: z.string().max(100).optional().or(z.literal("")),
  isActive: z.boolean().optional(),
});
