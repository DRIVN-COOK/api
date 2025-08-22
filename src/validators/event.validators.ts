import { z } from "zod";
import { idParamSchema, paginationQuerySchema } from "./common.js";

export const createEventSchema = z.object({
  franchiseeId: z.string().uuid(),
  title: z.string().min(2),
  description: z.string().max(1000).optional(),
  startAt: z.coerce.date(),
  endAt: z.coerce.date().optional(),
  locationId: z.string().uuid().optional(),
  isPublic: z.boolean().default(true),
});
export const updateEventSchema = createEventSchema.partial();
export const listEventQuerySchema = paginationQuerySchema.extend({
  franchiseeId: z.string().uuid().optional(),
  publicOnly: z.coerce.boolean().optional(),
});
export const eventIdParam = idParamSchema;