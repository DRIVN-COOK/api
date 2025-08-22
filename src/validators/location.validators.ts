import { z } from "zod";
import { idParamSchema, paginationQuerySchema } from "./common.js";

export const createLocationSchema = z.object({
  name: z.string().min(2),
  address: z.string().max(200).optional(),
  city: z.string().max(120).optional(),
  postalCode: z.string().max(30).optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  isRecurringSpot: z.boolean().default(false),
});
export const updateLocationSchema = createLocationSchema.partial();
export const listLocationQuerySchema = paginationQuerySchema;
export const locationIdParam = idParamSchema;