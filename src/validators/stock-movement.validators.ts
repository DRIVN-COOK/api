import { z } from "zod";
import { idParamSchema, paginationQuerySchema } from "./common.js";

export const listStockMovementQuerySchema = paginationQuerySchema.extend({
  warehouseId: z.string().uuid().optional(),
  productId: z.string().uuid().optional(),
  type: z.enum(["PURCHASE_IN","TRANSFER_IN","TRANSFER_OUT","SALE_OUT","ADJUSTMENT"]).optional(),
});
export const stockMovementIdParam = idParamSchema;