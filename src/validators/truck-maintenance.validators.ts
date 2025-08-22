import { z } from "zod";
import { idParamSchema, paginationQuerySchema } from "./common.js";
export const createTruckMaintenanceSchema = z.object({
  truckId: z.string().uuid(),
  type: z.enum(["SERVICE","REPAIR","INSPECTION"]).default("SERVICE"),
  status: z.enum(["PLANNED","IN_PROGRESS","DONE"]).default("PLANNED"),
  scheduledAt: z.coerce.date().optional(),
  completedAt: z.coerce.date().optional(),
  cost: z.coerce.number().nonnegative().optional(),
  notes: z.string().max(500).optional(),
});
export const updateTruckMaintenanceSchema = createTruckMaintenanceSchema.partial();
export const listTruckMaintenanceQuerySchema = paginationQuerySchema.extend({
  truckId: z.string().uuid().optional(),
  status: z.enum(["PLANNED","IN_PROGRESS","DONE"]).optional(),
});
export const truckMaintenanceIdParam = idParamSchema;