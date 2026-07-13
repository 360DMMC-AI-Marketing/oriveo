import { z } from "zod";
import { objectIdSchema } from "./common.js";

export const reportQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  patientId: objectIdSchema.optional(),
  signed: z.enum(["true", "false"]).optional(),
  sort: z.string().optional(),
});

export const signReportSchema = z.object({
  doctorNotes: z.string().optional(),
  digitalSignature: z.string().optional(),
});

export const bulkSignSchema = z.object({
  ids: z.array(objectIdSchema).min(1, "At least one report ID is required"),
  doctorNotes: z.string().optional(),
});

export const bulkDeleteSchema = z.object({
  ids: z.array(objectIdSchema).min(1, "At least one report ID is required"),
});
