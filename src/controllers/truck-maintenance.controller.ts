import type { RequestHandler } from "express";
import { PrismaClient, Prisma } from "@prisma/client";
import { asyncWrap, HttpError } from "../utils/handlers.js";

import {
  createTruckMaintenanceSchema,
  updateTruckMaintenanceSchema,
  listTruckMaintenanceQuerySchema,
  truckMaintenanceIdParam,
  truckIdOnlyParam,
  listMaintByTruckQuerySchema,
} from "../validators/truck-maintenance.validators.js";

const prisma = new PrismaClient();

/**
 * GET /truck-maintenances
 */
export const list: RequestHandler = asyncWrap(async (req, res) => {
  const { page = 1, pageSize = 20, truckId, status } =
    listTruckMaintenanceQuerySchema.parse(req.query);

  // Toujours fournir un objet (pas `undefined`) pour where
  const where: Prisma.TruckMaintenanceWhereInput = {
    ...(truckId ? { truckId } : {}),
    ...(status ? { status } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.truckMaintenance.findMany({
      where,
      include: { truck: true },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: "desc" },
    }),
    prisma.truckMaintenance.count({ where }),
  ]);

  res.json({ items, page, pageSize, total });
});

/**
 * GET /truck-maintenances/:id
 */
export const getById: RequestHandler = asyncWrap(async (req, res) => {
  const { id } = truckMaintenanceIdParam.parse(req.params);
  const item = await prisma.truckMaintenance.findUnique({
    where: { id },
    include: { truck: true },
  });
  if (!item) throw new HttpError(404, "Maintenance not found");
  res.json(item);
});

/**
 * POST /truck-maintenances
 * - Utilise le CreateInput “checked” (relations via connect)
 * - Champs nullable envoyés en `null` s’ils sont inclus
 */
export const create: RequestHandler = asyncWrap(async (req, res) => {
  const data = createTruckMaintenanceSchema.parse(req.body);

  const payload: Prisma.TruckMaintenanceCreateInput = {
    truck: { connect: { id: data.truckId } },
    ...(data.type ? { type: data.type } : {}),       // enums optionnels (defaults côté DB)
    ...(data.status ? { status: data.status } : {}), // idem
    ...(data.scheduledAt !== undefined
      ? { scheduledAt: data.scheduledAt ?? null }
      : {}),
    ...(data.completedAt !== undefined
      ? { completedAt: data.completedAt ?? null }
      : {}),
    ...(data.cost !== undefined ? { cost: data.cost ?? null } : {}),
    ...(data.notes !== undefined ? { notes: data.notes ?? null } : {}),
  };

  const created = await prisma.truckMaintenance.create({
    data: payload,
    include: { truck: true },
  });
  res.status(201).json(created);
});

/**
 * PATCH /truck-maintenances/:id
 * - UpdateInput “checked” + `{ set: ... }` pour les scalaires
 * - Relations via `connect` si fournies
 */
export const update: RequestHandler = asyncWrap(async (req, res) => {
  const { id } = truckMaintenanceIdParam.parse(req.params);
  const data = updateTruckMaintenanceSchema.parse(req.body);

  // Relation vers Truck (obligatoire au niveau modèle, mais modifiable via connect)
  const relationPart: Prisma.TruckMaintenanceUpdateInput = {
    ...(data.truckId !== undefined
      ? { truck: { connect: { id: data.truckId } } }
      : {}),
  };

  // Champs scalaires — utiliser { set: ... } et n’inclure que si définis
  const scalarPart: Prisma.TruckMaintenanceUpdateInput = {
    ...(data.type !== undefined ? { type: { set: data.type } } : {}),
    ...(data.status !== undefined ? { status: { set: data.status } } : {}),
    ...(data.scheduledAt !== undefined
      ? { scheduledAt: { set: data.scheduledAt ?? null } }
      : {}),
    ...(data.completedAt !== undefined
      ? { completedAt: { set: data.completedAt ?? null } }
      : {}),
    ...(data.cost !== undefined ? { cost: { set: data.cost ?? null } } : {}),
    ...(data.notes !== undefined ? { notes: { set: data.notes ?? null } } : {}),
  };

  const payload: Prisma.TruckMaintenanceUpdateInput = {
    ...relationPart,
    ...scalarPart,
  };

  const updated = await prisma.truckMaintenance.update({
    where: { id },
    data: payload,
    include: { truck: true },
  });
  res.json(updated);
});

/**
 * DELETE /truck-maintenances/:id
 */
export const remove: RequestHandler = asyncWrap(async (req, res) => {
  const { id } = truckMaintenanceIdParam.parse(req.params);
  await prisma.truckMaintenance.delete({ where: { id } });
  res.status(204).end();
});

/**
 * GET /trucks/:truckId/maintenances
 * Liste paginée des maintenances pour un camion donné.
 */
export const listByTruck: RequestHandler = asyncWrap(async (req, res) => {
  const { truckId } = truckIdOnlyParam.parse(req.params);
  const { page = 1, pageSize = 20, status } = listMaintByTruckQuerySchema.parse(req.query);

  // (facultatif) 404 si le truck n'existe pas
  const exists = await prisma.truck.findUnique({ where: { id: truckId }, select: { id: true } });
  if (!exists) throw new HttpError(404, "Truck not found");

  const where: Prisma.TruckMaintenanceWhereInput = {
    truckId,
    ...(status ? { status } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.truckMaintenance.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      include: { truck: { select: { plateNumber: true } } }, // utile pour l’affichage
    }),
    prisma.truckMaintenance.count({ where }),
  ]);

  res.json({ items, page, pageSize, total });
});
