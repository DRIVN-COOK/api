import { z } from "zod";
import { idParamSchema, paginationQuerySchema } from "./common.js";

export const createFranchiseAgreementSchema = z.object({
  franchiseeId: z.string().uuid(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
  entryFeeAmount: z.coerce.number().nonnegative(),
  revenueSharePct: z.coerce.number().min(0).max(1),
  notes: z.string().max(1000).optional(),
});
export const updateFranchiseAgreementSchema = createFranchiseAgreementSchema.partial();
export const listFranchiseAgreementQuerySchema = paginationQuerySchema.extend({
  franchiseeId: z.string().uuid().optional(),
});
export const franchiseAgreementIdParam = idParamSchema;