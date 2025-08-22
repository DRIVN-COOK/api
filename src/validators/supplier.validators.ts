import { z } from "zod";
import { idParamSchema, paginationQuerySchema } from "./common.js";

export const createSupplierSchema = z.object({
  name: z.string().min(2),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().max(30).optional(),
  address: z.string().max(200).optional(),
  active: z.boolean().default(true),
});
export const updateSupplierSchema = createSupplierSchema.partial();
export const listSupplierQuerySchema = paginationQuerySchema;
export const supplierIdParam = idParamSchema;