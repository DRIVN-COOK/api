import type { RequestHandler } from "express";
import { PrismaClient, Prisma } from "@prisma/client";
import { asyncWrap, HttpError } from "../utils/handlers.js";
import { createProductPriceSchema, updateProductPriceSchema, listProductPriceQuerySchema, productPriceIdParam } from "../validators/product-price.validators.js";

const prisma = new PrismaClient();

export const list: RequestHandler = asyncWrap(async (req, res) => {
  const { page = 1, pageSize = 20, productId } = listProductPriceQuerySchema.parse(req.query);
  const where: Prisma.ProductPriceWhereInput = productId ? { productId } : {};
  const [items, total] = await Promise.all([
    prisma.productPrice.findMany({ where, skip: (page - 1) * pageSize, take: pageSize, orderBy: { validFrom: "desc" } }),
    prisma.productPrice.count({ where }),
  ]);
  res.json({ items, page, pageSize, total });
});

export const getById: RequestHandler = asyncWrap(async (req, res) => {
  const { id } = productPriceIdParam.parse(req.params);
  const item = await prisma.productPrice.findUnique({ where: { id } });
  if (!item) throw new HttpError(404, "ProductPrice not found");
  res.json(item);
});

export const create: RequestHandler = asyncWrap(async (req, res) => {
  const { productId, validFrom, validTo, priceHT, tvaPct } = createProductPriceSchema.parse(req.body);
  const payload: Prisma.ProductPriceCreateInput = {
    product: { connect: { id: productId } },
    validFrom,
    validTo: validTo ?? null,
    priceHT,
    tvaPct,
  };
  const created = await prisma.productPrice.create({ data : payload });
  res.status(201).json(created);
});

export const update: RequestHandler = asyncWrap(async (req, res) => {
  const { id } = productPriceIdParam.parse(req.params);
  const d = updateProductPriceSchema.parse(req.body);
  const payload: Prisma.ProductPriceUpdateInput = {
    ...(d.validFrom !== undefined ? { validFrom: d.validFrom } : {}),
    ...(d.validTo !== undefined ? { validTo: d.validTo } : {}), // peut être null
    ...(d.priceHT !== undefined ? { priceHT: d.priceHT } : {}),
    ...(d.tvaPct !== undefined ? { tvaPct: d.tvaPct } : {}),
    ...(d.productId !== undefined ? { product: { connect: { id: d.productId } } } : {}),
  };
  const updated = await prisma.productPrice.update({ where: { id }, data : payload });
  res.json(updated);
});

export const remove: RequestHandler = asyncWrap(async (req, res) => {
  const { id } = productPriceIdParam.parse(req.params);
  await prisma.productPrice.delete({ where: { id } });
  res.status(204).end();
});