import { z } from "zod";
import { idParamSchema, paginationQuerySchema } from "./common.js";

export const createLoyaltyCardSchema = z.object({
  customerId: z.string().uuid(),
  cardNumber: z.string().min(6),
  points: z.coerce.number().int().min(0).default(0),
  tier: z.enum(["BASIC","SILVER","GOLD"]).default("BASIC"),
  printablePdfUrl: z.string().url().optional(),
});
export const updateLoyaltyCardSchema = createLoyaltyCardSchema.partial();
export const listLoyaltyCardQuerySchema = paginationQuerySchema.extend({
  customerId: z.string().uuid().optional(),
  cardNumber: z.string().optional(),
});
export const loyaltyCardIdParam = idParamSchema;