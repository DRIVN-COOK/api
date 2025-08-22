import { z } from "zod";
import { idParamSchema, paginationQuerySchema } from "./common.js";

export const createPurchaseOrderSchema = z.object({
  franchiseeId: z.string().uuid(),
  warehouseId: z.string().uuid(),
  // lignes créées dans endpoint dédié (PurchaseOrderLine)
});

export const updatePurchaseOrderSchema = z.object({
  // ex: permettre changement entrepôt avant submit
  warehouseId: z.string().uuid().optional(),
});

export const listPurchaseOrderQuerySchema = paginationQuerySchema.extend({
  status: z.enum(["DRAFT","SUBMITTED","PREPARING","READY","DELIVERED","CANCELLED"]).optional(),
});

export const poIdParam = idParamSchema;
