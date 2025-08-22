import { z } from "zod";
import { idParamSchema, paginationQuerySchema } from "./common.js";

export const registerEventSchema = z.object({
  eventId: z.string().uuid(),
  customerId: z.string().uuid(),
  status: z.enum(["REGISTERED","CANCELLED","ATTENDED"]).default("REGISTERED"),
});

export const updateEventRegistrationSchema = registerEventSchema.partial();

export const listEventRegistrationQuerySchema = paginationQuerySchema.extend({
  eventId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
  status: z.enum(["REGISTERED","CANCELLED","ATTENDED"]).optional(),
});

export const eventRegistrationIdParam = idParamSchema;