import { z } from "zod";
import { idParamSchema, paginationQuerySchema } from "./common.js";

export const createWarehouseInventorySchema = z.object({
  warehouseId: z.string().uuid(),
  productId: z.string().uuid(),
  onHand: z.coerce.number(),
  reserved: z.coerce.number().default(0),
});
export const updateWarehouseInventorySchema = createWarehouseInventorySchema.partial();
export const listWarehouseInventoryQuerySchema = paginationQuerySchema.extend({
  warehouseId: z.string().uuid().optional(),
  productId: z.string().uuid().optional(),
});
export const warehouseInventoryIdParam = idParamSchema;