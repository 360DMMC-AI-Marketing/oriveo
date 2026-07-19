import { z } from "zod";

export const createAppointmentSchema = z.object({
  patient: z.string().regex(/^[a-f\d]{24}$/i, "Invalid patient ID"),
  title: z.string().min(1, "Title is required").max(200),
  date: z.string().min(1, "Date is required"),
  time: z.string().optional().default("09:00"),
  duration: z.number().int().min(5).max(480).default(30),
  type: z.enum(["in-person", "phone", "video"]).default("in-person"),
  location: z.string().max(300).optional().or(z.literal("")),
  reason: z.string().max(500).optional().or(z.literal("")),
  notes: z.string().max(2000).optional().or(z.literal("")),
  status: z.enum(["scheduled", "confirmed", "in-progress", "completed", "cancelled", "no-show"]).default("scheduled"),
  provider: z.string().regex(/^[a-f\d]{24}$/i, "Invalid provider ID").optional().nullable().default(null),
});
