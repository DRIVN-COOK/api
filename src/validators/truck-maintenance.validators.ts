// api/src/validators/truckMaintenance.validators.ts
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

// Pour la route générique /truck-maintenances (filtre facultatif par truckId)
export const listTruckMaintenanceQuerySchema = paginationQuerySchema.extend({
  truckId: z.string().uuid().optional(),
  status: z.enum(["PLANNED","IN_PROGRESS","DONE"]).optional(),
});

export const truckMaintenanceIdParam = idParamSchema;

/* ▼▼ AJOUTS pour /trucks/:truckId/maintenances ▼▼ */

// Params de la route : on exige bien un truckId dans l'URL
export const truckIdOnlyParam = z.object({
  truckId: z.string().uuid(),
});

// Query pour la liste “par camion” : pas de truckId ici (il vient des params)
export const listMaintByTruckQuerySchema = paginationQuerySchema.extend({
  status: z.enum(["PLANNED","IN_PROGRESS","DONE"]).optional(),
});
