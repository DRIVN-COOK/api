import { z } from "zod";
import { idParamSchema, paginationQuerySchema } from "./common.js";

export const createFranchiseeSchema = z.object({
  name: z.string().min(2).max(120),
  siren: z.string().length(9).regex(/^\d+$/, "SIREN must be 9 digits"),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().min(6).max(30).optional(),
  billingAddress: z.string().max(300).optional(),
  joinDate: z.coerce.date().optional(),
  active: z.boolean().optional(),
  defaultWarehouseId: z.string().uuid().optional(),
});

export const updateFranchiseeSchema = createFranchiseeSchema.partial();

export const listFranchiseeQuerySchema = paginationQuerySchema;

export const franchiseeIdParam = idParamSchema;

export type CreateFranchiseeInput = z.infer<typeof createFranchiseeSchema>;
export type UpdateFranchiseeInput = z.infer<typeof updateFranchiseeSchema>;
