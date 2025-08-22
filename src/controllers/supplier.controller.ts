import type { RequestHandler } from "express";
import { PrismaClient, Prisma } from "@prisma/client";
import { asyncWrap, HttpError } from "../utils/handlers.js";
import {
  createSupplierSchema,
  updateSupplierSchema,
  listSupplierQuerySchema,
  supplierIdParam,
} from "../validators/supplier.validators.js";

const prisma = new PrismaClient();

/**
 * GET /suppliers
 */
export const list: RequestHandler = asyncWrap(async (req, res) => {
  const { page = 1, pageSize = 20, q } = listSupplierQuerySchema.parse(req.query);

  const where: Prisma.SupplierWhereInput = q
    ? { name: { contains: q, mode: "insensitive" } }
    : {};

  const [items, total] = await Promise.all([
    prisma.supplier.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: "desc" },
    }),
    prisma.supplier.count({ where }),
  ]);

  res.json({ items, page, pageSize, total });
});

/**
 * GET /suppliers/:id
 */
export const getById: RequestHandler = asyncWrap(async (req, res) => {
  const { id } = supplierIdParam.parse(req.params);
  const item = await prisma.supplier.findUnique({ where: { id } });
  if (!item) throw new HttpError(404, "Supplier not found");
  res.json(item);
});

/**
 * POST /suppliers
 */
export const create: RequestHandler = asyncWrap(async (req, res) => {
  const data = createSupplierSchema.parse(req.body);

  // Important: champs nullable => string | null (jamais undefined)
  const payload: Prisma.SupplierCreateInput = {
    name: data.name,                       // requis
    active: data.active ?? true,           // si tu as un default DB, tu peux simplement omettre la ligne
    contactEmail: data.contactEmail ?? null,
    contactPhone: data.contactPhone ?? null,
    address: data.address ?? null,
  };

  const created = await prisma.supplier.create({ data: payload });
  res.status(201).json(created);
});

/**
 * PATCH /suppliers/:id
 */
export const update: RequestHandler = asyncWrap(async (req, res) => {
  const { id } = supplierIdParam.parse(req.params);
  const data = updateSupplierSchema.parse(req.body);

  const payload: Prisma.SupplierUpdateInput = {
    ...(data.name !== undefined ? { name: { set: data.name } } : {}),
    ...(data.active !== undefined ? { active: { set: data.active } } : {}),
    ...(data.contactEmail !== undefined
      ? { contactEmail: { set: data.contactEmail ?? null } }
      : {}),
    ...(data.contactPhone !== undefined
      ? { contactPhone: { set: data.contactPhone ?? null } }
      : {}),
    ...(data.address !== undefined ? { address: { set: data.address ?? null } } : {}),
  };

  const updated = await prisma.supplier.update({ where: { id }, data: payload });
  res.json(updated);
});

/**
 * DELETE /suppliers/:id
 */
export const remove: RequestHandler = asyncWrap(async (req, res) => {
  const { id } = supplierIdParam.parse(req.params);
  await prisma.supplier.delete({ where: { id } });
  res.status(204).end();
});
