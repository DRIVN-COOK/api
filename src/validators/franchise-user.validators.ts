// validators/franchise-user.validators.ts
import { z } from "zod";
import { idParamSchema, paginationQuerySchema } from "./common.js";

const RoleInFranchise = z.enum(["OWNER", "MANAGER", "STAFF"]);

export const attachFranchiseUserSchema = z.object({
  userId: z.string().uuid(),
  franchiseeId: z.string().uuid(),
  roleInFranchise: RoleInFranchise.optional(),
});
export const updateFranchiseUserSchema = attachFranchiseUserSchema.partial();
export const listFranchiseUserQuerySchema = paginationQuerySchema.extend({
  userId: z.string().uuid().optional(),
  franchiseeId: z.string().uuid().optional(),
});
export const franchiseUserIdParam = idParamSchema;
