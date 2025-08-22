import { z } from "zod";
import { idParamSchema, paginationQuerySchema } from "./common.js";

export const attachFranchiseUserSchema = z.object({
  userId: z.string().uuid(),
  franchiseeId: z.string().uuid(),
  roleInFranchise: z.string().max(50).optional(),
});
export const updateFranchiseUserSchema = attachFranchiseUserSchema.partial();
export const listFranchiseUserQuerySchema = paginationQuerySchema.extend({
  userId: z.string().uuid().optional(),
  franchiseeId: z.string().uuid().optional(),
});
export const franchiseUserIdParam = idParamSchema;