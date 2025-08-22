import type { RequestHandler } from "express";
import { PrismaClient, Prisma } from "@prisma/client";
import { asyncWrap, HttpError } from "../utils/handlers.js";
import {
  createTruckSchema,
  updateTruckSchema,
  listTruckQuerySchema,
  truckIdParam,
} from "../validators/truck.validators.js";

const prisma = new PrismaClient();

/**
 * GET /trucks
 */
export const list: RequestHandler = asyncWrap(async (req, res) => {
  const { page = 1, pageSize = 20, franchiseeId, status } =
    listTruckQuerySchema.parse(req.query);

  // Toujours fournir un objet (jamais `undefined`) pour where
  const where: Prisma.TruckWhereInput = {
    ...(franchiseeId ? { franchiseeId } : {}),
    ...(status ? { currentStatus: status } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.truck.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: "desc" },
    }),
    prisma.truck.count({ where }),
  ]);

  res.json({ items, page, pageSize, total });
});

/**
 * GET /trucks/:id
 */
export const getById: RequestHandler = asyncWrap(async (req, res) => {
  const { id } = truckIdParam.parse(req.params);
  const item = await prisma.truck.findUnique({ where: { id } });
  if (!item) throw new HttpError(404, "Truck not found");
  res.json(item);
});

/**
 * POST /trucks
 * - Utilise TruckCreateInput (relations via `connect`)
 * - Champs nullable envoyés en `null` s’ils sont inclus
 */
export const create: RequestHandler = asyncWrap(async (req, res) => {
  const data = createTruckSchema.parse(req.body);

  const payload: Prisma.TruckCreateInput = {
    franchisee: { connect: { id: data.franchiseeId } }, // relation
    vin: data.vin,
    plateNumber: data.plateNumber,
    ...(data.active !== undefined ? { active: data.active } : {}),
    ...(data.currentStatus !== undefined ? { currentStatus: data.currentStatus } : {}),
    // nullable : si inclus, accepter null, sinon omettre
    ...(data.model !== undefined ? { model: data.model ?? null } : {}),
    ...(data.purchaseDate !== undefined ? { purchaseDate: data.purchaseDate ?? null } : {}),
  };

  const created = await prisma.truck.create({ data: payload });
  res.status(201).json(created);
});

/**
 * PATCH /trucks/:id
 * - Relations: `connect` si fournies
 * - Scalars: utiliser `{ set: ... }`
 * - Nullable: `{ set: valeur ?? null }` si inclus
 */
export const update: RequestHandler = asyncWrap(async (req, res) => {
  const { id } = truckIdParam.parse(req.params);
  const data = updateTruckSchema.parse(req.body);

  // Relations conditionnelles
  const relationPart: Prisma.TruckUpdateInput = {
    ...(data.franchiseeId !== undefined
      ? { franchisee: { connect: { id: data.franchiseeId } } }
      : {}),
  };

  // Scalars (non-nullables)
  const scalarNonNull: Prisma.TruckUpdateInput = {
    ...(data.vin !== undefined ? { vin: { set: data.vin } } : {}),
    ...(data.plateNumber !== undefined ? { plateNumber: { set: data.plateNumber } } : {}),
    ...(data.active !== undefined ? { active: { set: data.active } } : {}),
    ...(data.currentStatus !== undefined ? { currentStatus: { set: data.currentStatus } } : {}),
  };

  // Scalars (nullable) -> autoriser null explicitement si fourni
  const scalarNullable: Prisma.TruckUpdateInput = {
    ...(data.model !== undefined ? { model: { set: data.model ?? null } } : {}),
    ...(data.purchaseDate !== undefined ? { purchaseDate: { set: data.purchaseDate ?? null } } : {}),
  };

  const payload: Prisma.TruckUpdateInput = {
    ...relationPart,
    ...scalarNonNull,
    ...scalarNullable,
  };

  const updated = await prisma.truck.update({ where: { id }, data: payload });
  res.json(updated);
});

/**
 * DELETE /trucks/:id
 */
export const remove: RequestHandler = asyncWrap(async (req, res) => {
  const { id } = truckIdParam.parse(req.params);
  await prisma.truck.delete({ where: { id } });
  res.status(204).end();
});
