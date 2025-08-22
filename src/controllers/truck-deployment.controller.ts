import type { RequestHandler } from "express";
import { PrismaClient, Prisma } from "@prisma/client";
import { asyncWrap, HttpError } from "../utils/handlers.js";
import {
  createTruckDeploymentSchema,
  updateTruckDeploymentSchema,
  listTruckDeploymentQuerySchema,
  truckDeploymentIdParam,
} from "../validators/truck-deployment.validators.js";

const prisma = new PrismaClient();

/**
 * GET /truck-deployments
 */
export const list: RequestHandler = asyncWrap(async (req, res) => {
  const { page = 1, pageSize = 20, truckId, franchiseeId } =
    listTruckDeploymentQuerySchema.parse(req.query);

  const where: Prisma.TruckDeploymentWhereInput = {
    ...(truckId ? { truckId } : {}),
    ...(franchiseeId ? { franchiseeId } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.truckDeployment.findMany({
      where,
      include: { truck: true, location: true, franchisee: true },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { plannedStart: "desc" },
    }),
    prisma.truckDeployment.count({ where }),
  ]);

  res.json({ items, page, pageSize, total });
});

/**
 * GET /truck-deployments/:id
 */
export const getById: RequestHandler = asyncWrap(async (req, res) => {
  const { id } = truckDeploymentIdParam.parse(req.params);
  const item = await prisma.truckDeployment.findUnique({
    where: { id },
    include: { truck: true, location: true, franchisee: true },
  });
  if (!item) throw new HttpError(404, "Truck deployment not found");
  res.json(item);
});

/**
 * POST /truck-deployments (schedule)
 */
export const schedule: RequestHandler = asyncWrap(async (req, res) => {
  const data = createTruckDeploymentSchema.parse(req.body);

  const payload: Prisma.TruckDeploymentCreateInput = {
    truck: { connect: { id: data.truckId } },
    franchisee: { connect: { id: data.franchiseeId } },
    ...(data.locationId ? { location: { connect: { id: data.locationId } } } : {}),
    plannedStart: data.plannedStart,                 // requis
    plannedEnd: data.plannedEnd ?? null,             // nullable -> jamais undefined
    notes: data.notes ?? null,                       // nullable -> jamais undefined
  };

  const created = await prisma.truckDeployment.create({
    data: payload,
    include: { truck: true, location: true, franchisee: true },
  });
  res.status(201).json(created);
});

/**
 * PATCH /truck-deployments/:id
 */
export const update: RequestHandler = asyncWrap(async (req, res) => {
  const { id } = truckDeploymentIdParam.parse(req.params);
  const data = updateTruckDeploymentSchema.parse(req.body);

  const relationPart: Prisma.TruckDeploymentUpdateInput = {
    ...(data.truckId !== undefined
      ? { truck: { connect: { id: data.truckId } } }
      : {}),
    ...(data.franchiseeId !== undefined
      ? { franchisee: { connect: { id: data.franchiseeId } } }
      : {}),
    ...(data.locationId !== undefined
      ? data.locationId
        ? { location: { connect: { id: data.locationId } } }
        : { location: { disconnect: true } }
      : {}),
  };

  const scalarPart: Prisma.TruckDeploymentUpdateInput = {
    ...(data.plannedStart !== undefined
      ? { plannedStart: { set: data.plannedStart } }
      : {}),
    ...(data.plannedEnd !== undefined
      ? { plannedEnd: { set: data.plannedEnd ?? null } }
      : {}),
    ...(data.notes !== undefined
      ? { notes: { set: data.notes ?? null } }
      : {}),
  };

  const payload: Prisma.TruckDeploymentUpdateInput = {
    ...relationPart,
    ...scalarPart,
  };

  const updated = await prisma.truckDeployment.update({
    where: { id },
    data: payload,
    include: { truck: true, location: true, franchisee: true },
  });
  res.json(updated);
});

/**
 * DELETE /truck-deployments/:id
 */
export const cancel: RequestHandler = asyncWrap(async (req, res) => {
  const { id } = truckDeploymentIdParam.parse(req.params);
  await prisma.truckDeployment.delete({ where: { id } });
  res.status(204).end();
});
