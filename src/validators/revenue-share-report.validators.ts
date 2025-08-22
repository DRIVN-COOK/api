import { z } from "zod";
import { idParamSchema, paginationQuerySchema } from "./common.js";

export const listRevenueShareReportQuerySchema = paginationQuerySchema.extend({
  franchiseeId: z.string().uuid().optional(),
  period: z.string().max(20).optional(), // "YYYY-MM"
});

export const revenueShareReportIdParam = idParamSchema;

export const generateReportSchema = z.object({
  franchiseeId: z.string().uuid(),
  period: z.string().min(7).max(7), // "YYYY-MM"
});