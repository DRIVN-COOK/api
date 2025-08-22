import type { RequestHandler } from "express";
import { PrismaClient, Prisma } from "@prisma/client";
import { asyncWrap, HttpError } from "../utils/handlers.js";
import {
  createProductSchema,
  updateProductSchema,
  listProductQuerySchema,
  productIdParam,
} from "../validators/product.validators.js";

const prisma = new PrismaClient();

export const listPublic: RequestHandler = asyncWrap(async (req, res) => {
  const { page = 1, pageSize = 20, q, type, core, active } =
    listProductQuerySchema.parse(req.query);

  // Construire un where *valide* (évite de passer `where: undefined`)
  const where: Prisma.ProductWhereInput = {};
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { sku: { contains: q, mode: "insensitive" } },
    ];
  }
  if (type) where.type = type;
  if (core !== undefined) where.isCoreStock = core;
  if (active !== undefined) where.active = active;

  const hasFilters = Object.keys(where).length > 0;

  const findArgs: Prisma.ProductFindManyArgs = {
    ...(hasFilters ? { where } : {}),
    skip: (page - 1) * pageSize,
    take: pageSize,
    orderBy: { createdAt: "desc" },
  };

  const countArgs: Prisma.ProductCountArgs = {
    ...(hasFilters ? { where } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.product.findMany(findArgs),
    prisma.product.count(countArgs),
  ]);

  res.json({ items, page, pageSize, total });
});

export const getByIdPublic: RequestHandler = asyncWrap(async (req, res) => {
  const { id } = productIdParam.parse(req.params);
  const item = await prisma.product.findUnique({ where: { id } });
  if (!item) throw new HttpError(404, "Product not found");
  res.json(item);
});

export const create: RequestHandler = asyncWrap(async (req, res) => {
  const data = createProductSchema.parse(req.body);

  // Unicité SKU
  const exists = await prisma.product.findUnique({ where: { sku: data.sku } });
  if (exists) throw new HttpError(409, "SKU already exists");

  // Tous ces champs sont non-nullables dans le schema => on les passe tels quels
  const payload: Prisma.ProductCreateInput = {
    sku: data.sku,
    name: data.name,
    type: data.type,
    unit: data.unit,
    isCoreStock: data.isCoreStock,
    active: data.active,
  };

  const created = await prisma.product.create({ data: payload });
  res.status(201).json(created);
});

export const update: RequestHandler = asyncWrap(async (req, res) => {
  const { id } = productIdParam.parse(req.params);
  const data = updateProductSchema.parse(req.body);

  // Avec exactOptionalPropertyTypes, on *omet* les champs undefined
  // et on utilise les FieldUpdateOperationsInput (`{ set: ... }`)
  const payload: Prisma.ProductUpdateInput = {
    ...(data.sku !== undefined ? { sku: { set: data.sku } } : {}),
    ...(data.name !== undefined ? { name: { set: data.name } } : {}),
    ...(data.type !== undefined ? { type: { set: data.type } } : {}),
    ...(data.unit !== undefined ? { unit: { set: data.unit } } : {}),
    ...(data.isCoreStock !== undefined ? { isCoreStock: { set: data.isCoreStock } } : {}),
    ...(data.active !== undefined ? { active: { set: data.active } } : {}),
  };

  const updated = await prisma.product.update({ where: { id }, data: payload });
  res.json(updated);
});

export const remove: RequestHandler = asyncWrap(async (req, res) => {
  const { id } = productIdParam.parse(req.params);
  await prisma.product.delete({ where: { id } });
  res.status(204).end();
});
