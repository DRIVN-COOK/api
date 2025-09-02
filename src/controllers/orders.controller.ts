// src/controllers/customer-order.controller.ts (ou orders.controller.ts)
import type { RequestHandler } from "express";
import { PrismaClient } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { asyncWrap, HttpError } from "../utils/handlers.js";
import { createOrderBodySchema } from "../validators/orders.validators.js";

const prisma = new PrismaClient();

/**
 * POST /api/orders
 */
export const createOrder: RequestHandler = asyncWrap(async (req, res) => {
  const input = createOrderBodySchema.parse(req.body);

  const order = await prisma.$transaction(async (tx: Prisma.TransactionClient) => { // ✅ type du tx
    // 1) Charger les MenuItems nécessaires
    type MenuItemSelected = Prisma.MenuItemGetPayload<{
      select: { id: true; priceHT: true; tvaPct: true; productId: true }
    }>;

    const menuItemIds = Array.from(new Set(input.lines.map(l => l.menuItemId)));
    const menuItems = await tx.menuItem.findMany({
      where: { id: { in: menuItemIds } },
      select: { id: true, priceHT: true, tvaPct: true, productId: true },
    }) as MenuItemSelected[];

    const miMap = new Map<string, MenuItemSelected>(menuItems.map(m => [m.id, m])); // ✅ Map typée

    // 2) Construire les lignes + totaux
    type LineData = {
      menuItemId: string;
      qty: number;
      unitPriceHT: Decimal;
      tvaPct: Decimal;
      lineTotalHT: Decimal;
      _productId: string | null;
    };

    const linesData: LineData[] = input.lines.map((l) => {
      const mi = miMap.get(l.menuItemId);
      if (!mi) throw new HttpError(400, `MenuItem introuvable: ${l.menuItemId}`);

      // Les champs Decimal renvoyés par Prisma sont déjà des Decimal “vivants”
      const unit = mi.priceHT as unknown as Decimal;
      const qty = new Decimal(l.qty);
      const lineTotalHT = unit.mul(qty);              // Decimal
      const tvaPct = mi.tvaPct as unknown as Decimal; // Decimal

      return {
        menuItemId: l.menuItemId,
        qty: l.qty,
        unitPriceHT: unit,
        tvaPct,
        lineTotalHT,
        _productId: mi.productId ?? null,
      };
    });

    const totalHT  = linesData.reduce((s, d) => s.plus(d.lineTotalHT), new Decimal(0));
    const totalTVA = linesData.reduce((s, d) => s.plus(d.lineTotalHT.mul(d.tvaPct).div(100)), new Decimal(0));
    const totalTTC = totalHT.plus(totalTVA);

    // 3) Créer la commande + lignes
    const created = await tx.customerOrder.create({
      data: {
        customerId: input.customerId,
        franchiseeId: input.franchiseeId,
        truckId: input.truckId ?? null,
        warehouseId: input.warehouseId ?? null,
        channel: input.channel ?? "IN_PERSON",
        status: "PENDING",
        totalHT,
        totalTVA,
        totalTTC,
        lines: {
          create: linesData.map(d => ({
            menuItemId: d.menuItemId,
            qty: d.qty,
            unitPriceHT: d.unitPriceHT,
            tvaPct: d.tvaPct,
            lineTotalHT: d.lineTotalHT,
          })),
        },
      },
      include: { lines: true },
    });

    // 4) Consommer le stock (camion OU entrepôt)
    if (created.truckId) {
      for (const d of linesData) {
        if (!d._productId) continue;
        const productId = d._productId;
        const need = new Decimal(d.qty);

        const inv = await tx.truckInventory.findUnique({
          where: { truckId_productId: { truckId: created.truckId, productId } },
        });
        const onHand = new Decimal(inv?.onHand ?? 0);
        if (onHand.lt(need)) {
          throw new HttpError(400,
            `Stock insuffisant sur le camion pour le produit ${productId} (dispo ${onHand.toString()}, requis ${need.toString()})`
          );
        }

        await tx.truckInventory.update({
          where: { truckId_productId: { truckId: created.truckId, productId } },
          data: { onHand: { decrement: need } },
        });

        await tx.stockMovement.create({
          data: {
            truckId: created.truckId,         
            productId,
            qty: need.neg(),
            type: "SALE_OUT",
            refType: "CustomerOrder",
            refId: created.id,
          },
        });
      }
    } else if (created.warehouseId) {
      for (const d of linesData) {
        if (!d._productId) continue;
        const productId = d._productId;
        const need = new Decimal(d.qty);

        const inv = await tx.warehouseInventory.findUnique({
          where: { warehouseId_productId: { warehouseId: created.warehouseId, productId } },
        });
        const onHand = new Decimal(inv?.onHand ?? 0);
        if (onHand.lt(need)) {
          throw new HttpError(400,
            `Stock insuffisant à l’entrepôt pour le produit ${productId} (dispo ${onHand.toString()}, requis ${need.toString()})`
          );
        }

        await tx.warehouseInventory.update({
          where: { warehouseId_productId: { warehouseId: created.warehouseId, productId } },
          data: { onHand: { decrement: need } },
        });

        await tx.stockMovement.create({
          data: {
            warehouseId: created.warehouseId,
            productId,
            qty: need.neg(),
            type: "SALE_OUT",
            refType: "CustomerOrder",
            refId: created.id,
          },
        });
      }
    }

    // 5) Confirmer
    return tx.customerOrder.update({
      where: { id: created.id },
      data: { status: "CONFIRMED" },
      include: { lines: true },
    });
  });

  res.status(201).json(order);
});
