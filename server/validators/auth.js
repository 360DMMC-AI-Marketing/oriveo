import { z } from "zod";

export const inviteSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email address"),
  role: z.enum(["admin", "doctor", "nurse", "receptionist", "staff", "user"]),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

export const signupSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["admin", "doctor", "nurse", "receptionist", "staff", "user"]).optional(),
  profession: z.string().optional(),
  clinicName: z.string().min(1).max(200),
  clinicSlug: z.string().min(1).max(100),
  phone: z.string().optional(),
  specialty: z.union([z.string(), z.array(z.string())]).optional(),
  clinicType: z.enum(["human", "dental", "veterinary"]),
  clinicSize: z.enum(["small", "large"]).optional().default("small"),
  hasDepartments: z.boolean().optional(),
  staffSetup: z.object({
    doctors: z.number().min(0).optional(),
    nurses: z.number().min(0).optional(),
    receptionists: z.number().min(0).optional(),
    otherStaff: z.number().min(0).optional(),
    workstations: z.number().min(1).optional(),
  }).optional(),
});
