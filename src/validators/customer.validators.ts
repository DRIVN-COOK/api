import { z } from "zod";
import { idParamSchema, paginationQuerySchema } from "./common.js";

export const createCustomerSchema = z.object({
  userId: z.string().uuid(), // client connecté obligatoire
  phone: z.string().min(6).max(30).optional(),
  defaultCity: z.string().max(120).optional(),
  defaultZip: z.string().max(20).optional(),
});

export const updateCustomerSchema = createCustomerSchema.partial();

export const listCustomerQuerySchema = paginationQuerySchema;

export const customerIdParam = idParamSchema;

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
