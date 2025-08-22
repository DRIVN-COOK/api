import { z } from "zod";
import { idParamSchema, paginationQuerySchema } from "./common.js";

export const createCustomerOrderLineSchema = z.object({
  customerOrderId: z.string().uuid(),
  menuItemId: z.string().uuid(),
  qty: z.coerce.number().int().positive(),
  unitPriceHT: z.coerce.number().nonnegative(),
  tvaPct: z.coerce.number().min(0).max(100),
  lineTotalHT: z.coerce.number().nonnegative(),
});
export const updateCustomerOrderLineSchema = createCustomerOrderLineSchema.partial();
export const listCustomerOrderLineQuerySchema = paginationQuerySchema.extend({
  customerOrderId: z.string().uuid().optional(),
});
export const customerOrderLineIdParam = idParamSchema;
