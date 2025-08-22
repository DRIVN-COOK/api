import type { RequestHandler } from "express";
import { PrismaClient, Prisma } from "@prisma/client";
import { asyncWrap, HttpError } from "../utils/handlers.js";
import {
  registerEventSchema,
  updateEventRegistrationSchema,
  listEventRegistrationQuerySchema,
  eventRegistrationIdParam,
} from "../validators/event-registration.validators.js";

const prisma = new PrismaClient();

export const list: RequestHandler = asyncWrap(async (req, res) => {
  const { page = 1, pageSize = 20, eventId, customerId, status } = listEventRegistrationQuerySchema.parse(req.query);
  const where: any = {};
  if (eventId) where.eventId = eventId;
  if (customerId) where.customerId = customerId;
  if (status) where.status = status;

  const [items, total] = await Promise.all([
    prisma.eventRegistration.findMany({
      where,
      include: { event: true, customer: true },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { registeredAt: "desc" },
    }),
    prisma.eventRegistration.count({ where }),
  ]);

  res.json({ items, page, pageSize, total });
});

export const getById: RequestHandler = asyncWrap(async (req, res) => {
  const { id } = eventRegistrationIdParam.parse(req.params);
  const item = await prisma.eventRegistration.findUnique({
    where: { id },
    include: { event: true, customer: true },
  });
  if (!item) throw new HttpError(404, "Event registration not found");
  res.json(item);
});

export const registerPublic: RequestHandler = asyncWrap(async (req, res) => {
  const data = registerEventSchema.parse(req.body);
  // empêche un doublon (unique eventId+customerId dans le schéma)
  const exists = await prisma.eventRegistration.findFirst({
    where: { eventId: data.eventId, customerId: data.customerId },
  });
  if (exists) throw new HttpError(409, "Already registered for this event");
  const created = await prisma.eventRegistration.create({ data });
  res.status(201).json(created);
});

export const update: RequestHandler = asyncWrap(async (req, res) => {
  const { id } = eventRegistrationIdParam.parse(req.params);
  const data = updateEventRegistrationSchema.parse(req.body);

  const relationPart: Prisma.EventRegistrationUpdateInput = {
    ...(data.eventId !== undefined ? { event: { connect: { id: data.eventId } } } : {}),
    ...(data.customerId !== undefined ? { customer: { connect: { id: data.customerId } } } : {}),
  };

  const scalarPart: Prisma.EventRegistrationUpdateInput = {
    ...(data.status !== undefined ? { status: data.status } : {}),
  };

  const payload: Prisma.EventRegistrationUpdateInput = {
    ...relationPart,
    ...scalarPart,
  };

  const updated = await prisma.eventRegistration.update({ where: { id }, data: payload });
  res.json(updated);
});


export const cancel: RequestHandler = asyncWrap(async (req, res) => {
  const { id } = eventRegistrationIdParam.parse(req.params);
  const updated = await prisma.eventRegistration.update({
    where: { id },
    data: { status: "CANCELLED" },
  });
  res.json(updated);
});