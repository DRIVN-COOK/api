import { z } from "zod";

export const createOrderBodySchema = z.object({
  customerId: z.string().uuid("customerId must be a valid UUID"),
  franchiseeId: z.string().uuid("franchiseeId must be a valid UUID"),
  truckId: z.string().uuid("truckId must be a valid UUID").optional().nullable(),
  warehouseId: z.string().uuid("warehouseId must be a valid UUID").optional().nullable(),
  channel: z.enum(["IN_PERSON", "ONLINE_PREORDER"]).optional(),
  lines: z.array(
    z.object({
      menuItemId: z.string().uuid("menuItemId must be a valid UUID"),
      qty: z.number().int().positive("qty must be a positive integer"),
    })
  ).min(1, "lines must contain at least one item"),
}).refine((d) => !!d.truckId || !!d.warehouseId, {
  message: "Either truckId or warehouseId must be provided",
  path: ["truckId"],
});
