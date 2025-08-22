import { z } from "zod";
import { idParamSchema, paginationQuerySchema } from "./common.js";

export const createTruckSchema = z.object({
  franchiseeId: z.string().uuid(),
  vin: z.string().min(5),
  plateNumber: z.string().min(3),
  model: z.string().max(120).optional(),
  purchaseDate: z.coerce.date().optional(),
  active: z.boolean().default(true),
  currentStatus: z.enum(["AVAILABLE","DEPLOYED","IN_MAINTENANCE","OUT_OF_SERVICE"]).default("AVAILABLE"),
});
export const updateTruckSchema = createTruckSchema.partial();
export const listTruckQuerySchema = paginationQuerySchema.extend({
  franchiseeId: z.string().uuid().optional(),
  status: z.enum(["AVAILABLE","DEPLOYED","IN_MAINTENANCE","OUT_OF_SERVICE"]).optional(),
});
export const truckIdParam = idParamSchema;
