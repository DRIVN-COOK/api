import type { RequestHandler } from "express";
import { PrismaClient, Prisma } from "@prisma/client";
import { asyncWrap, HttpError } from "../utils/handlers.js";
import {
  createLocationSchema,
  updateLocationSchema,
  listLocationQuerySchema,
  locationIdParam,
} from "../validators/location.validators.js";

const prisma = new PrismaClient();

/**
 * GET /public/locations
 */
export const listPublic: RequestHandler = asyncWrap(async (req, res) => {
  const { page = 1, pageSize = 20, q } = listLocationQuerySchema.parse(req.query);

  const where: Prisma.LocationWhereInput = q
    ? {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { city: { contains: q, mode: "insensitive" } },
        ],
      }
    : {};

  const [items, total] = await Promise.all([
    prisma.location.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: "desc" },
    }),
    prisma.location.count({ where }),
  ]);

  res.json({ items, page, pageSize, total });
});

/**
 * GET /public/locations/:id
 */
export const getByIdPublic: RequestHandler = asyncWrap(async (req, res) => {
  const { id } = locationIdParam.parse(req.params);
  const item = await prisma.location.findUnique({ where: { id } });
  if (!item) throw new HttpError(404, "Location not found");
  res.json(item);
});

/**
 * POST /locations
 */
export const create: RequestHandler = asyncWrap(async (req, res) => {
  const data = createLocationSchema.parse(req.body);

  const payload: Prisma.LocationCreateInput = {
    name: data.name,
    address: data.address ?? null,
    city: data.city ?? null,
    postalCode: data.postalCode ?? null,
    lat: data.lat ?? null,
    lng: data.lng ?? null,
    isRecurringSpot: data.isRecurringSpot ?? false,
  };

  const created = await prisma.location.create({ data: payload });
  res.status(201).json(created);
});

/**
 * PATCH /locations/:id
 */
export const update: RequestHandler = asyncWrap(async (req, res) => {
  const { id } = locationIdParam.parse(req.params);
  const data = updateLocationSchema.parse(req.body);

  // Construire un LocationUpdateInput sans aucune propriété 'undefined'
  const payload: Prisma.LocationUpdateInput = {
    ...(data.name !== undefined ? { name: { set: data.name } } : {}),
    ...(data.address !== undefined ? { address: { set: data.address ?? null } } : {}),
    ...(data.city !== undefined ? { city: { set: data.city ?? null } } : {}),
    ...(data.postalCode !== undefined ? { postalCode: { set: data.postalCode ?? null } } : {}),
    ...(data.lat !== undefined ? { lat: { set: data.lat ?? null } } : {}),
    ...(data.lng !== undefined ? { lng: { set: data.lng ?? null } } : {}),
    ...(data.isRecurringSpot !== undefined
      ? { isRecurringSpot: { set: data.isRecurringSpot } }
      : {}),
  };

  const updated = await prisma.location.update({ where: { id }, data: payload });
  res.json(updated);
});

/**
 * DELETE /locations/:id
 */
export const remove: RequestHandler = asyncWrap(async (req, res) => {
  const { id } = locationIdParam.parse(req.params);
  await prisma.location.delete({ where: { id } });
  res.status(204).end();
});
