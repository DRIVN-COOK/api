import { z } from "zod";
import { idParamSchema, paginationQuerySchema } from "./common.js";

export const listSalesSummaryQuerySchema = paginationQuerySchema.extend({
  franchiseeId: z.string().uuid().optional(),
  period: z.string().max(20).optional(), // ex: "2025-07" ou "2025-07-21"
});

export const salesSummaryIdParam = idParamSchema;

export const rebuildSummarySchema = z.object({
  franchiseeId: z.string().uuid().optional(), // rebuild global ou par franchise
  period: z.string().min(4).max(20).optional(),
});