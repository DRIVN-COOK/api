import { z } from "zod";
import { idParamSchema, paginationQuerySchema } from "./common.js";

export const createMenuItemSchema = z.object({
  productId: z.string().uuid().optional(),
  name: z.string().min(2),
  description: z.string().max(500).optional(),
  isActive: z.boolean().default(true),
  priceHT: z.coerce.number().nonnegative(),
  tvaPct: z.coerce.number().min(0).max(100),
});
export const updateMenuItemSchema = createMenuItemSchema.partial();
export const listMenuItemQuerySchema = paginationQuerySchema.extend({
  active: z.coerce.boolean().optional(),
});
export const menuItemIdParam = idParamSchema;