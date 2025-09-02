// validators/truck.validators.ts
import { z } from "zod";
import { idParamSchema, paginationQuerySchema } from "./common.js";

// petit helper (accepte '' / undefined / null)
const nullableUuid = z.preprocess(
  (v) => (v === '' || v === undefined ? null : v),
  z.string().uuid().nullable()
);

export const createTruckSchema = z.object({
  franchiseeId: nullableUuid.optional(),    // ← déjà présent
  warehouseId:  nullableUuid.optional(),    // ← AJOUTE ÇA

  vin: z.string().min(5),
  plateNumber: z.string().min(3),
  model: z.string().max(120).optional().nullable(),
  purchaseDate: z.preprocess(
    (v) => (v === '' || v === null ? null : v),
    z.coerce.date().nullable()
  ).optional(),
  active: z.boolean().default(true),
  currentStatus: z.enum(["AVAILABLE","DEPLOYED","IN_MAINTENANCE","OUT_OF_SERVICE"]).default("AVAILABLE"),
});

export const updateTruckSchema = createTruckSchema.partial();

export const listTruckQuerySchema = paginationQuerySchema.extend({
  franchiseeId: z.string().uuid().optional(),
  status: z.enum(["AVAILABLE","DEPLOYED","IN_MAINTENANCE","OUT_OF_SERVICE"]).optional(),
});

export const truckIdParam = idParamSchema;