import { z } from "zod";

export const replenishTruckParamsSchema = z.object({
  truckId: z.string().uuid(),
});

export const replenishTruckBodySchema = z.object({
  warehouseId: z.string().uuid(),
  items: z.array(
    z.object({
      productId: z.string().uuid(),
      qty: z.coerce.number().int().positive(),
    })
  ).min(1),
});
