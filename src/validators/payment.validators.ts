import { z } from "zod";
import { idParamSchema, paginationQuerySchema } from "./common.js";

export const createPaymentSchema = z.object({
  customerOrderId: z.string().uuid(),
  provider: z.enum(["CARD","CASH","ONLINE"]),
  amount: z.coerce.number().nonnegative(),
});
export const updatePaymentSchema = z.object({
  status: z.enum(["PENDING","PAID","FAILED","REFUNDED"]).optional(),
  transactionRef: z.string().max(200).optional(),
});
export const listPaymentQuerySchema = paginationQuerySchema.extend({
  customerOrderId: z.string().uuid().optional(),
  status: z.enum(["PENDING","PAID","FAILED","REFUNDED"]).optional(),
});
export const paymentIdParam = idParamSchema;
