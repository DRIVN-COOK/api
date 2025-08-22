import type { RequestHandler } from "express";
import { PrismaClient, Prisma } from "@prisma/client";
import { asyncWrap, HttpError } from "../utils/handlers.js";
import {
  createWarehouseInventorySchema,
  updateWarehouseInventorySchema,
  listWarehouseInventoryQuerySchema,
  warehouseInventoryIdParam,
} from "../validators/warehouse-inventory.validators.js";

const prisma = new PrismaClient();

export const list: RequestHandler = asyncWrap(async (req, res) => {
  const { page = 1, pageSize = 20, warehouseId, productId } =
    listWarehouseInventoryQuerySchema.parse(req.query);

  // Toujours un objet (pas `undefined`)
  const where: Prisma.WarehouseInventoryWhereInput = {
    ...(warehouseId ? { warehouseId } : {}),
    ...(productId ? { productId } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.warehouseInventory.findMany({
      where,
      include: { warehouse: true, product: true },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { updatedAt: "desc" },
    }),
    prisma.warehouseInventory.count({ where }),
  ]);

  res.json({ items, page, pageSize, total });
});

export const getById: RequestHandler = asyncWrap(async (req, res) => {
  const { id } = warehouseInventoryIdParam.parse(req.params);
  const item = await prisma.warehouseInventory.findUnique({
    where: { id },
    include: { warehouse: true, product: true },
  });
  if (!item) throw new HttpError(404, "WarehouseInventory not found");
  res.json(item);
});

// Ajustements manuels (pas via mouvements automatiques)
export const createAdjust: RequestHandler = asyncWrap(async (req, res) => {
  const data = createWarehouseInventorySchema.parse(req.body);
  // CreateInput “checked” : relations via connect, pas de FKs brutes
  const payload: Prisma.WarehouseInventoryCreateInput = {
    warehouse: { connect: { id: data.warehouseId } },
    product: { connect: { id: data.productId } },
    onHand: data.onHand,     // Decimal/number accepté par Prisma
    reserved: data.reserved, // idem
  };

  const created = await prisma.warehouseInventory.create({
    data: payload,
    include: { warehouse: true, product: true },
  });
  res.status(201).json(created);
});

export const updateAdjust: RequestHandler = asyncWrap(async (req, res) => {
  const { id } = warehouseInventoryIdParam.parse(req.params);
  const data = updateWarehouseInventorySchema.parse(req.body);

  // Relations : seulement si fournies
  const relationPart: Prisma.WarehouseInventoryUpdateInput = {
    ...(data.warehouseId !== undefined
      ? { warehouse: { connect: { id: data.warehouseId } } }
      : {}),
    ...(data.productId !== undefined
      ? { product: { connect: { id: data.productId } } }
      : {}),
  };

  // Scalars : { set: ... } et seulement si définis
  const scalarPart: Prisma.WarehouseInventoryUpdateInput = {
    ...(data.onHand !== undefined ? { onHand: { set: data.onHand } } : {}),
    ...(data.reserved !== undefined ? { reserved: { set: data.reserved } } : {}),
  };

  const payload: Prisma.WarehouseInventoryUpdateInput = {
    ...relationPart,
    ...scalarPart,
  };

  const updated = await prisma.warehouseInventory.update({
    where: { id },
    data: payload,
    include: { warehouse: true, product: true },
  });
  res.json(updated);
});

export const removeAdjust: RequestHandler = asyncWrap(async (req, res) => {
  const { id } = warehouseInventoryIdParam.parse(req.params);
  await prisma.warehouseInventory.delete({ where: { id } });
  res.status(204).end();
});
