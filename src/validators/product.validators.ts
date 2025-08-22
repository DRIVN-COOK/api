import { z } from "zod";
import { idParamSchema, paginationQuerySchema } from "./common.js";

export const createProductSchema = z.object({
  sku: z.string().min(2).max(80),
  name: z.string().min(2).max(150),
  type: z.enum(["INGREDIENT", "PREPARED_DISH", "BEVERAGE", "MISC"]).default("INGREDIENT"),
  unit: z.enum(["KG", "L", "UNIT"]).default("UNIT"),
  isCoreStock: z.boolean().default(true),
  active: z.boolean().default(true),
});

export const updateProductSchema = createProductSchema.partial();

export const listProductQuerySchema = paginationQuerySchema.extend({
  type: z.enum(["INGREDIENT", "PREPARED_DISH", "BEVERAGE", "MISC"]).optional(),
  core: z.coerce.boolean().optional(),
  active: z.coerce.boolean().optional(),
});

export const productIdParam = idParamSchema;

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
