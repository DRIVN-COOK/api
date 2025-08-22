import type { RequestHandler } from "express";
import { PrismaClient, Prisma } from "@prisma/client";
import { asyncWrap, HttpError } from "../utils/handlers.js";
import {
  createPurchaseOrderLineSchema,
  updatePurchaseOrderLineSchema,
  listPurchaseOrderLineQuerySchema,
  purchaseOrderLineIdParam,
} from "../validators/purchase-order-line.validators.js";

const prisma = new PrismaClient();

/**
 * GET /purchase-order-lines
 */
export const list: RequestHandler = asyncWrap(async (req, res) => {
  const { page = 1, pageSize = 20, purchaseOrderId } =
    listPurchaseOrderLineQuerySchema.parse(req.query);

  // Toujours passer un objet (pas undefined) pour `where`
  const where: Prisma.PurchaseOrderLineWhereInput = purchaseOrderId
    ? { purchaseOrderId }
    : {};

  const [items, total] = await Promise.all([
    prisma.purchaseOrderLine.findMany({
      where,
      include: { product: true, purchaseOrder: true },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { id: "desc" },
    }),
    prisma.purchaseOrderLine.count({ where }),
  ]);

  res.json({ items, page, pageSize, total });
});

/**
 * GET /purchase-order-lines/:id
 */
export const getById: RequestHandler = asyncWrap(async (req, res) => {
  const { id } = purchaseOrderLineIdParam.parse(req.params);
  const item = await prisma.purchaseOrderLine.findUnique({
    where: { id },
    include: { product: true, purchaseOrder: true },
  });
  if (!item) throw new HttpError(404, "PurchaseOrderLine not found");
  res.json(item);
});

/**
 * POST /purchase-order-lines
 */
export const addLine: RequestHandler = asyncWrap(async (req, res) => {
  const data = createPurchaseOrderLineSchema.parse(req.body);
  // IMPORTANT: isCoreItem est requis dans le schéma Prisma.
  // Assure-toi que `createPurchaseOrderLineSchema` le valide bien.
  const payload: Prisma.PurchaseOrderLineCreateInput = {
    purchaseOrder: { connect: { id: data.purchaseOrderId } },
    product: { connect: { id: data.productId } },
    qty: data.qty,                 // Decimal: number/string ok côté Prisma
    unitPriceHT: data.unitPriceHT, // Decimal
    tvaPct: data.tvaPct,           // Decimal
    isCoreItem: data.isCoreItem,   // Boolean (requis)
  };

  const created = await prisma.purchaseOrderLine.create({
    data: payload,
    include: { product: true, purchaseOrder: true },
  });
  res.status(201).json(created);
});

/**
 * PATCH /purchase-order-lines/:id
 */
export const updateLine: RequestHandler = asyncWrap(async (req, res) => {
  const { id } = purchaseOrderLineIdParam.parse(req.params);
  const data = updatePurchaseOrderLineSchema.parse(req.body);

  // Relations : connecter seulement si fourni
  const relationPart: Prisma.PurchaseOrderLineUpdateInput = {
    ...(data.purchaseOrderId !== undefined
      ? { purchaseOrder: { connect: { id: data.purchaseOrderId } } }
      : {}),
    ...(data.productId !== undefined
      ? { product: { connect: { id: data.productId } } }
      : {}),
  };

  // Scalars : utiliser { set: ... } et inclure uniquement si défini
  const scalarPart: Prisma.PurchaseOrderLineUpdateInput = {
    ...(data.qty !== undefined ? { qty: { set: data.qty } } : {}),
    ...(data.unitPriceHT !== undefined ? { unitPriceHT: { set: data.unitPriceHT } } : {}),
    ...(data.tvaPct !== undefined ? { tvaPct: { set: data.tvaPct } } : {}),
    ...(data.isCoreItem !== undefined ? { isCoreItem: { set: data.isCoreItem } } : {}),
  };

  const payload: Prisma.PurchaseOrderLineUpdateInput = {
    ...relationPart,
    ...scalarPart,
  };

  if (Object.keys(payload).length === 0) {
    throw new HttpError(400, "No fields to update");
  }

  const updated = await prisma.purchaseOrderLine.update({
    where: { id },
    data: payload,
    include: { product: true, purchaseOrder: true },
  });
  res.json(updated);
});

/**
 * DELETE /purchase-order-lines/:id
 */
export const removeLine: RequestHandler = asyncWrap(async (req, res) => {
  const { id } = purchaseOrderLineIdParam.parse(req.params);
  await prisma.purchaseOrderLine.delete({ where: { id } });
  res.status(204).end();
});
