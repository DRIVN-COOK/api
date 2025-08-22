import { z } from "zod";
import { idParamSchema, paginationQuerySchema } from "./common.js";

export const createCustomerOrderSchema = z.object({
  customerId: z.string().uuid(),
  franchiseeId: z.string().uuid(),
  truckId: z.string().uuid().optional(),
  warehouseId: z.string().uuid().optional(),
  channel: z.enum(["IN_PERSON","ONLINE_PREORDER"]).default("IN_PERSON"),
  scheduledPickupAt: z.coerce.date().optional(),
  totalHT: z.coerce.number().nonnegative(),
  totalTVA: z.coerce.number().nonnegative(),
  totalTTC: z.coerce.number().nonnegative(),
});

export const updateCustomerOrderStatusSchema = z.object({
  status: z.enum(["PENDING","CONFIRMED","PREPARING","READY","FULFILLED","CANCELLED"]),
});

export const listCustomerOrderQuerySchema = paginationQuerySchema.extend({
  status: z.enum(["PENDING","CONFIRMED","PREPARING","READY","FULFILLED","CANCELLED"]).optional(),
  franchiseeId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
});

export const coIdParam = idParamSchema;
