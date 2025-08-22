import type { RequestHandler } from "express";
import { PrismaClient, Prisma } from "@prisma/client";
import { asyncWrap, HttpError } from "../utils/handlers.js";
import { createWarehouseSchema, updateWarehouseSchema, listWarehouseQuerySchema, warehouseIdParam } from "../validators/warehouse.validators.js";

const prisma = new PrismaClient();

export const listPublic: RequestHandler = asyncWrap(async (req, res) => {
  const { page = 1, pageSize = 20, q } = listWarehouseQuerySchema.parse(req.query);
  const where: Prisma.WarehouseWhereInput = q
  ? { OR: [
      { name: { contains: q, mode: "insensitive" } },
      { city: { contains: q, mode: "insensitive" } },
    ] }
  : {};
  const [items, total] = await Promise.all([
    prisma.warehouse.findMany({ where, skip: (page - 1) * pageSize, take: pageSize, orderBy: { createdAt: "desc" } }),
    prisma.warehouse.count({ where }),
  ]);
  res.json({ items, page, pageSize, total });
});

export const getByIdPublic: RequestHandler = asyncWrap(async (req, res) => {
  const { id } = warehouseIdParam.parse(req.params);
  const item = await prisma.warehouse.findUnique({ where: { id } });
  if (!item) throw new HttpError(404, "Warehouse not found");
  res.json(item);
});

export const create: RequestHandler = asyncWrap(async (req, res) => {
  const data = createWarehouseSchema.parse(req.body);
  const payload: Prisma.WarehouseCreateInput = {
    name: data.name,
    address: data.address ?? null,
    city: data.city ?? null,
    postalCode: data.postalCode ?? null,
    lat: data.lat ?? null,
    lng: data.lng ?? null,
    hasKitchen: data.hasKitchen,
    active: data.active ?? true,
  };
  const created = await prisma.warehouse.create({ data: payload })
  res.status(201).json(created);
});

export const update: RequestHandler = asyncWrap(async (req, res) => {
  const { id } = warehouseIdParam.parse(req.params);
  const data = updateWarehouseSchema.parse(req.body);
  const payload: Prisma.WarehouseUpdateInput = {
  ...(data.name !== undefined ? { name: data.name } : {}),
  ...(data.address !== undefined ? { address: data.address } : {}),
  ...(data.city !== undefined ? { city: data.city } : {}),
  ...(data.postalCode !== undefined ? { postalCode: data.postalCode } : {}),
  ...(data.lat !== undefined ? { lat: data.lat } : {}),
  ...(data.lng !== undefined ? { lng: data.lng } : {}),
  ...(data.hasKitchen !== undefined ? { hasKitchen: data.hasKitchen } : {}),
  ...(data.active !== undefined ? { active: data.active } : {}),
};
  const updated = await prisma.warehouse.update({ where: { id }, data : payload });
  res.json(updated);
});

export const remove: RequestHandler = asyncWrap(async (req, res) => {
  const { id } = warehouseIdParam.parse(req.params);
  await prisma.warehouse.delete({ where: { id } });
  res.status(204).end();
});