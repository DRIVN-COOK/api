import { z } from "zod";
import { idParamSchema, paginationQuerySchema } from "./common.js";

export const issueInvoiceSchema = z.object({
  customerOrderId: z.string().uuid(),
  invoiceNumber: z.string().min(3),
});
export const listInvoiceQuerySchema = paginationQuerySchema.extend({
  customerOrderId: z.string().uuid().optional(),
});
export const invoiceIdParam = idParamSchema;