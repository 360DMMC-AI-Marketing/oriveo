import { z } from "zod";

export const createOrgSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  slug: z.string().min(1, "Slug is required").max(100).regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with dashes"),
  settings: z.object({}).passthrough().optional(),
});

export const updateOrgSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/).optional(),
  isActive: z.boolean().optional(),
  settings: z.object({}).passthrough().optional(),
});

export const addOrgUserSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["admin", "doctor", "nurse", "receptionist", "staff", "user"]).default("staff"),
});

export const subscriptionSchema = z.object({
  plan: z.enum(["starter", "professional", "enterprise", "custom"]),
  status: z.enum(["active", "inactive", "past_due", "cancelled", "trial"]).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  features: z.object({}).passthrough().optional(),
  maxUsers: z.number().int().positive().optional(),
  maxPatients: z.number().int().positive().optional(),
  monthlyCalls: z.number().int().positive().optional(),
});

export const settingsSchema = z.object({
  configs: z.array(z.object({
    key: z.string().min(1).max(100),
    value: z.string().default(""),
    category: z.string().max(50).optional(),
  })).min(1, "At least one config is required"),
});
