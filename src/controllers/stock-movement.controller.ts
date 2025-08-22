import type { RequestHandler } from "express";
import { PrismaClient } from "@prisma/client";
import { asyncWrap, HttpError } from "../utils/handlers.js";
import { listStockMovementQuerySchema, stockMovementIdParam } from "../validators/stock-movement.validators.js";

const prisma = new PrismaClient();

export const list: RequestHandler = asyncWrap(async (req, res) => {
  const { page = 1, pageSize = 20, warehouseId, productId, type } = listStockMovementQuerySchema.parse(req.query);
  const where: any = {};
  if (warehouseId) where.warehouseId = warehouseId;
  if (productId) where.productId = productId;
  if (type) where.type = type;

  const [items, total] = await Promise.all([
    prisma.stockMovement.findMany({
      where,
      include: { warehouse: true, product: true },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: "desc" },
    }),
    prisma.stockMovement.count({ where }),
  ]);
  res.json({ items, page, pageSize, total });
});

export const getById: RequestHandler = asyncWrap(async (req, res) => {
  const { id } = stockMovementIdParam.parse(req.params);
  const item = await prisma.stockMovement.findUnique({ where: { id } });
  if (!item) throw new HttpError(404, "StockMovement not found");
  res.json(item);
});