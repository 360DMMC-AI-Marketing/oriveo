import { z } from "zod";
import { objectIdSchema } from "./common.js";

export const notificationQuerySchema = z.object({
  read: z.enum(["true", "false"]).optional(),
  type: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export const markReadSchema = z.object({
  id: objectIdSchema,
});

export const deleteNotificationSchema = z.object({
  id: objectIdSchema,
});
