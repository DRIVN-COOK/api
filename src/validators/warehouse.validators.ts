import { z } from "zod";
import { idParamSchema, paginationQuerySchema } from "./common.js";

export const createWarehouseSchema = z.object({
  name: z.string().min(2),
  address: z.string().max(200).optional(),
  city: z.string().max(120).optional(),
  postalCode: z.string().max(30).optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  hasKitchen: z.boolean().default(true),
  active: z.boolean().default(true),
});
export const updateWarehouseSchema = createWarehouseSchema.partial();
export const listWarehouseQuerySchema = paginationQuerySchema;
export const warehouseIdParam = idParamSchema;