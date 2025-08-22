import type { RequestHandler } from "express";
import { PrismaClient, Prisma } from "@prisma/client";
import { asyncWrap, HttpError } from "../utils/handlers.js";
import {
  createEventSchema,
  updateEventSchema,
  listEventQuerySchema,
  eventIdParam,
} from "../validators/event.validators.js";

const prisma = new PrismaClient();

export const listPublic: RequestHandler = asyncWrap(async (req, res) => {
  const { page = 1, pageSize = 20, franchiseeId, publicOnly } =
    listEventQuerySchema.parse(req.query);

  const where: Prisma.EventWhereInput = {
    ...(franchiseeId ? { franchiseeId } : {}),
    ...(publicOnly ? { isPublic: true } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.event.findMany({
      where,
      include: { location: true, franchisee: true },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { startAt: "desc" },
    }),
    prisma.event.count({ where }),
  ]);

  res.json({ items, page, pageSize, total });
});

export const getByIdPublic: RequestHandler = asyncWrap(async (req, res) => {
  const { id } = eventIdParam.parse(req.params);
  const item = await prisma.event.findUnique({
    where: { id },
    include: { location: true, franchisee: true },
  });
  if (!item) throw new HttpError(404, "Event not found");
  res.json(item);
});

export const create: RequestHandler = asyncWrap(async (req, res) => {
  const data = createEventSchema.parse(req.body);

  // EventCreateInput : fournir tous les requis (title, startAt, isPublic, franchisee)
  // et forcer les nullable en `null` si non fournis (description, endAt, location).
  const payload: Prisma.EventCreateInput = {
    title: data.title,
    description: data.description ?? null,
    startAt: data.startAt,
    endAt: data.endAt ?? null,
    isPublic: data.isPublic,
    franchisee: { connect: { id: data.franchiseeId } },
    ...(data.locationId ? { location: { connect: { id: data.locationId } } } : {}),
  };

  const created = await prisma.event.create({
    data: payload,
    include: { location: true, franchisee: true },
  });
  res.status(201).json(created);
});

export const update: RequestHandler = asyncWrap(async (req, res) => {
  const { id } = eventIdParam.parse(req.params);
  const data = updateEventSchema.parse(req.body);

  // Relations
  const relationPart: Prisma.EventUpdateInput = {
    ...(data.franchiseeId !== undefined
      ? { franchisee: { connect: { id: data.franchiseeId } } }
      : {}),
    ...(data.locationId !== undefined
      ? (data.locationId
          ? { location: { connect: { id: data.locationId } } }
          : { location: { disconnect: true } })
      : {}),
  };

  // Scalars (ne jamais envoyer `undefined`, utiliser { set: ... })
  const scalarPart: Prisma.EventUpdateInput = {
    ...(data.title !== undefined ? { title: { set: data.title } } : {}),
    ...(data.description !== undefined
      ? { description: { set: data.description ?? null } }
      : {}),
    ...(data.startAt !== undefined ? { startAt: { set: data.startAt } } : {}),
    ...(data.endAt !== undefined ? { endAt: { set: data.endAt ?? null } } : {}),
    ...(data.isPublic !== undefined ? { isPublic: { set: data.isPublic } } : {}),
  };

  const payload: Prisma.EventUpdateInput = {
    ...relationPart,
    ...scalarPart,
  };

  if (Object.keys(payload).length === 0) {
    throw new HttpError(400, "No fields to update");
  }

  const updated = await prisma.event.update({
    where: { id },
    data: payload,
    include: { location: true, franchisee: true },
  });

  res.json(updated);
});

export const remove: RequestHandler = asyncWrap(async (req, res) => {
  const { id } = eventIdParam.parse(req.params);
  await prisma.event.delete({ where: { id } });
  res.status(204).end();
});
