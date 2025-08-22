// src/controllers/menu-item.controller.ts
import type { RequestHandler } from "express";
import { PrismaClient, Prisma } from "@prisma/client";
import { asyncWrap, HttpError } from "../utils/handlers.js";
import {
  createMenuItemSchema,
  updateMenuItemSchema,
  listMenuItemQuerySchema,
  menuItemIdParam,
} from "../validators/menu-item.validators.js";

const prisma = new PrismaClient();

export const listPublic: RequestHandler = asyncWrap(async (req, res) => {
  const { page = 1, pageSize = 20, active } = listMenuItemQuerySchema.parse(req.query);
  const where: Prisma.MenuItemWhereInput = {};
  if (active !== undefined) where.isActive = active;

  const [items, total] = await Promise.all([
    prisma.menuItem.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: "desc" },
    }),
    prisma.menuItem.count({ where }),
  ]);
  res.json({ items, page, pageSize, total });
});

export const getByIdPublic: RequestHandler = asyncWrap(async (req, res) => {
  const { id } = menuItemIdParam.parse(req.params);
  const item = await prisma.menuItem.findUnique({ where: { id } });
  if (!item) throw new HttpError(404, "MenuItem not found");
  res.json(item);
});

export const create: RequestHandler = asyncWrap(async (req, res) => {
  const { productId, description, ...rest } = createMenuItemSchema.parse(req.body);

  const data: Prisma.MenuItemCreateInput = {
    ...rest, // name, isActive, priceHT, tvaPct (scalars)
    ...(description !== undefined ? { description: description ?? null } : {}), // ❗ pas d'undefined
    ...(productId ? { product: { connect: { id: productId } } } : {}),
  };

  const created = await prisma.menuItem.create({ data });
  res.status(201).json(created);
});

export const update: RequestHandler = asyncWrap(async (req, res) => {
  const { id } = menuItemIdParam.parse(req.params);
  const { productId, description, ...partial } = updateMenuItemSchema.parse(req.body);

  const data: Prisma.MenuItemUpdateInput = {};

  // Scalars — on n’assigne que si défini (évite undefined)
  if (partial.name !== undefined) data.name = partial.name;
  if (partial.isActive !== undefined) data.isActive = partial.isActive;
  if (partial.priceHT !== undefined) data.priceHT = partial.priceHT as any;
  if (partial.tvaPct !== undefined) data.tvaPct = partial.tvaPct as any;

  // Nullable description
  if (description !== undefined) data.description = description ?? null;

  // Relation product
  if (productId === null) data.product = { disconnect: true };
  else if (productId !== undefined) data.product = { connect: { id: productId } };

  const updated = await prisma.menuItem.update({ where: { id }, data });
  res.json(updated);
});

export const remove: RequestHandler = asyncWrap(async (req, res) => {
  const { id } = menuItemIdParam.parse(req.params);
  await prisma.menuItem.delete({ where: { id } });
  res.status(204).end();
});
