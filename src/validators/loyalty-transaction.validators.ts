import { z } from "zod";
import { idParamSchema, paginationQuerySchema } from "./common.js";

export const earnOrSpendSchema = z.object({
  loyaltyCardId: z.string().uuid(),
  type: z.enum(["EARN","SPEND","ADJUST"]),
  points: z.coerce.number().int(),
  customerId: z.string().uuid().optional(),
  refType: z.string().max(80).optional(),
  refId: z.string().max(80).optional(),
});
export const listLoyaltyTxnQuerySchema = paginationQuerySchema.extend({
  loyaltyCardId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
});
export const loyaltyTxnIdParam = idParamSchema;