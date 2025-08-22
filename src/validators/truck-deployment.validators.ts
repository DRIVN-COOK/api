import { z } from "zod";
import { idParamSchema, paginationQuerySchema } from "./common.js";

export const createTruckDeploymentSchema = z.object({
  truckId: z.string().uuid(),
  franchiseeId: z.string().uuid(),
  locationId: z.string().uuid().optional(),
  plannedStart: z.coerce.date(),
  plannedEnd: z.coerce.date().optional(),
  notes: z.string().max(500).optional(),
});
export const updateTruckDeploymentSchema = createTruckDeploymentSchema.partial();
export const listTruckDeploymentQuerySchema = paginationQuerySchema.extend({
  truckId: z.string().uuid().optional(),
  franchiseeId: z.string().uuid().optional(),
});
export const truckDeploymentIdParam = idParamSchema;
