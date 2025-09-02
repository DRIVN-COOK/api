import type { RequestHandler } from "express";
import { PrismaClient } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { asyncWrap, HttpError } from "../utils/handlers.js";
import {
  replenishTruckParamsSchema,
  replenishTruckBodySchema,
} from "../validators/stock.validators.js";

const prisma = new PrismaClient();

export const replenish: RequestHandler = asyncWrap(async (req, res) => {
  const { truckId } = replenishTruckParamsSchema.parse(req.params);
  const { warehouseId, items } = replenishTruckBodySchema.parse(req.body);

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    // cache produits (maxPerTruck + name)
    const products = await tx.product.findMany({
      where: { id: { in: Array.from(new Set(items.map(i => i.productId))) } },
      select: { id: true, name: true, maxPerTruck: true },
    });
    type ProductRow = (typeof products)[number];
    const prodMap = new Map<string, ProductRow>(products.map(p => [p.id, p]));

    for (const { productId, qty } of items) {
      const q = new Decimal(qty);
      const prod = prodMap.get(productId);
      if (!prod) {
        throw new HttpError(400, `Produit introuvable: ${productId}`);
      }

      // a) stock entrepôt
      const wInv = await tx.warehouseInventory.findUnique({
        where: { warehouseId_productId: { warehouseId, productId } },
      });
      const wOnHand = new Decimal(wInv?.onHand ?? 0);
      if (wOnHand.lt(q)) {
        throw new HttpError(
          400,
          `Stock insuffisant à l’entrepôt pour ${prod.name ?? productId} (dispo ${wOnHand.toString()}, requis ${q.toString()})`,
        );
      }

      // b) plafond par produit
      if (prod.maxPerTruck != null) {
        const tInv = await tx.truckInventory.findUnique({
          where: { truckId_productId: { truckId, productId } },
        });
        const current = new Decimal(tInv?.onHand ?? 0);
        const max = new Decimal(prod.maxPerTruck);
        if (current.plus(q).gt(max)) {
          throw new HttpError(
            400,
            `Limite dépassée pour ${prod.name ?? productId}: max ${max.toString()} par camion (actuel ${current.toString()}, ajout ${q.toString()})`,
          );
        }
      }

      // c) décrément entrepôt + mouvement
      await tx.warehouseInventory.update({
        where: { warehouseId_productId: { warehouseId, productId } },
        data: { onHand: { decrement: q } },
      });
      await tx.stockMovement.create({
        data: {
          warehouseId,
          productId,
          qty: q.neg(),
          type: "TRANSFER_OUT",
          refType: "TruckReplenishment",
          refId: truckId,
        },
      });

      // d) incrément camion + mouvement
      await tx.truckInventory.upsert({
        where: { truckId_productId: { truckId, productId } },
        create: { truckId, productId, onHand: q, reserved: new Decimal(0) },
        update: { onHand: { increment: q } },
      });
      await tx.stockMovement.create({
        data: {
          truckId,
          productId,
          qty: q,
          type: "TRANSFER_IN",
          refType: "TruckReplenishment",
          refId: truckId,
        },
      });
    }
  });

  res.status(201).json({
    status: "OK",
    truckId,
    warehouseId,
    movedLines: items.length,
  });
});
