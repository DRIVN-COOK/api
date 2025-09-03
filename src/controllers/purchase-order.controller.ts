import type { RequestHandler } from "express";
import { PrismaClient, Prisma } from "@prisma/client";
import { asyncWrap, HttpError } from "../utils/handlers.js";
import {
  createPurchaseOrderSchema,
  updatePurchaseOrderSchema,
  listPurchaseOrderQuerySchema,
  poIdParam,
} from "../validators/purchase-order.validators.js";

const prisma = new PrismaClient();

/**
 * GET /purchase-orders
 */
export const list: RequestHandler = asyncWrap(async (req, res) => {
  const { page = 1, pageSize = 20, status } =
    listPurchaseOrderQuerySchema.parse(req.query);

  const where: Prisma.PurchaseOrderWhereInput = status ? { status } : {};

  const [orders, total] = await Promise.all([
    prisma.purchaseOrder.findMany({
      where,
      include: {
        franchisee: true,
        warehouse: true,
        lines: {
          select: { qty: true, unitPriceHT: true }, // on ne prend que l’essentiel
        },
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { orderedAt: 'desc' },
    }),
    prisma.purchaseOrder.count({ where }),
  ]);

  // map DTO: calcule totalHT et n’expose pas les lines complètes si inutile
  const items = orders.map((po) => {
    const totalHTDecimal = po.lines.reduce((sum, l) => {
      // Prisma.Decimal safe (évite les erreurs d’arrondi flottant)
      return sum.add(new Prisma.Decimal(l.qty).mul(l.unitPriceHT));
    }, new Prisma.Decimal(0));

    return {
      id: po.id,
      status: po.status,
      orderedAt: po.orderedAt,
      createdAt: po.createdAt,
      franchiseeId: po.franchiseeId,
      warehouseId: po.warehouseId,
      franchisee: po.franchisee
        ? { id: po.franchisee.id, name: po.franchisee.name ?? null }
        : null,
      warehouse: po.warehouse
        ? { id: po.warehouse.id, name: po.warehouse.name ?? null, code: po.warehouse.postalCode ?? null, city: po.warehouse.city ?? null }
        : null,
      totalHT: totalHTDecimal.toFixed(2), // ← string "123.45"
      // corePct: si un jour tu le calcules ici, ajoute-le
    };
  });

  res.json({ items, page, pageSize, total });
});

/**
 * GET /purchase-orders/:id
 */
export const getById: RequestHandler = asyncWrap(async (req, res) => {
  const { id } = poIdParam.parse(req.params);
  const item = await prisma.purchaseOrder.findUnique({
    where: { id },
    include: { lines: { include: { product: true } }, franchisee: true, warehouse: true },
  });
  if (!item) throw new HttpError(404, "Purchase order not found");
  res.json(item);
});

/**
 * POST /purchase-orders (brouillon)
 * Validators: createPurchaseOrderSchema -> { franchiseeId: string; warehouseId: string }
 */
export const createDraft: RequestHandler = asyncWrap(async (req, res) => {
  const data = createPurchaseOrderSchema.parse(req.body);

  const payload: Prisma.PurchaseOrderCreateInput = {
    // FKs via relations (checked create input)
    franchisee: { connect: { id: data.franchiseeId } },
    warehouse: { connect: { id: data.warehouseId } },
    // Pas de orderedAt ici car ton validator ne le fournit pas
    // status a une valeur par défaut DRAFT côté schéma
  };

  const created = await prisma.purchaseOrder.create({
    data: payload,
    include: { franchisee: true, warehouse: true, lines: true },
  });
  res.status(201).json(created);
});

/**
 * PATCH /purchase-orders/:id (édition brouillon uniquement)
 * Validators: updatePurchaseOrderSchema -> { warehouseId?: string }
 * (Si tu souhaites éditer d’autres champs, ajoute-les au validator)
 */
export const updateDraft: RequestHandler = asyncWrap(async (req, res) => {
  const { id } = poIdParam.parse(req.params);
  const data = updatePurchaseOrderSchema.parse(req.body);

  const po = await prisma.purchaseOrder.findUnique({ where: { id } });
  if (!po) throw new HttpError(404, "PO not found");
  if (po.status !== "DRAFT") throw new HttpError(409, "PO is not editable");

  // Seule la relation warehouse est modifiable selon ton validator actuel
  const relationPart: Prisma.PurchaseOrderUpdateInput = {
    ...(data.warehouseId !== undefined
      ? { warehouse: { connect: { id: data.warehouseId } } }
      : {}),
  };

  if (Object.keys(relationPart).length === 0) {
    // Rien à mettre à jour selon le schéma fourni
    return res.json(po);
  }

  const updated = await prisma.purchaseOrder.update({
    where: { id },
    data: relationPart,
    include: { franchisee: true, warehouse: true, lines: true },
  });
  res.json(updated);
});

/**
 * POST /purchase-orders/:id/submit
 * -> 80/20 puis SUBMITTED + corePct/freePct
 */
export const submit: RequestHandler = asyncWrap(async (req, res) => {
  const { id } = poIdParam.parse(req.params);
  const po = await prisma.purchaseOrder.findUnique({
    where: { id },
    include: { lines: { include: { product: true } } },
  });
  if (!po) throw new HttpError(404, "PO not found");
  if (po.status !== "DRAFT") throw new HttpError(409, "PO not in DRAFT");

  const totalQty = po.lines.reduce((s, l) => s + Number(l.qty), 0);
  const coreQty = po.lines.filter((l) => l.isCoreItem).reduce((s, l) => s + Number(l.qty), 0);
  const corePct = totalQty > 0 ? coreQty / totalQty : 0;
  if (corePct < 0.8) throw new HttpError(422, "80/20 rule not satisfied");

  const updated = await prisma.purchaseOrder.update({
    where: { id },
    data: {
      status: "SUBMITTED",
      corePct,
      freePct: 1 - corePct,
    },
    include: { franchisee: true, warehouse: true, lines: true },
  });
  res.json(updated);
});

/**
 * POST /purchase-orders/:id/cancel
 */
export const cancel: RequestHandler = asyncWrap(async (req, res) => {
  const { id } = poIdParam.parse(req.params);
  const po = await prisma.purchaseOrder.findUnique({ where: { id } });
  if (!po) throw new HttpError(404, "PO not found");
  if (["DELIVERED", "CANCELLED"].includes(po.status))
    throw new HttpError(409, "PO cannot be cancelled");

  await prisma.purchaseOrder.update({
    where: { id },
    data: { status: "CANCELLED" },
  });
  res.status(204).end();
});
