import { z } from "zod";
import { idParamSchema, paginationQuerySchema } from "./common.js";

export const createPurchaseOrderLineSchema = z.object({
  purchaseOrderId: z.string().uuid(),
  productId: z.string().uuid(),
  qty: z.coerce.number().positive(),
  unitPriceHT: z.coerce.number().nonnegative(),
  tvaPct: z.coerce.number().min(0).max(100),
  isCoreItem: z.boolean(),
});
export const updatePurchaseOrderLineSchema = createPurchaseOrderLineSchema.partial();
export const listPurchaseOrderLineQuerySchema = paginationQuerySchema.extend({
  purchaseOrderId: z.string().uuid().optional(),
});
export const purchaseOrderLineIdParam = idParamSchema;