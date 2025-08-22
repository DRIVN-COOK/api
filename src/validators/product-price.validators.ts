import { z } from "zod";
import { idParamSchema, paginationQuerySchema } from "./common.js";
export const createProductPriceSchema = z.object({
  productId: z.string().uuid(),
  validFrom: z.coerce.date(),
  validTo: z.coerce.date().optional(),
  priceHT: z.coerce.number().nonnegative(),
  tvaPct: z.coerce.number().min(0).max(100),
});
export const updateProductPriceSchema = createProductPriceSchema.partial();
export const listProductPriceQuerySchema = paginationQuerySchema.extend({
  productId: z.string().uuid().optional(),
});
export const productPriceIdParam = idParamSchema;