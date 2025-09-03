// src/controllers/event-registration.controller.ts
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

/**
 * GET /event-registrations
 */
export const list: RequestHandler = asyncWrap(async (req, res) => {
  const { page = 1, pageSize = 20, eventId, customerId, status } =
    listEventRegistrationQuerySchema.parse(req.query);

  const where: Prisma.EventRegistrationWhereInput = {
    ...(eventId ? { eventId } : {}),
    ...(customerId ? { customerId } : {}),
    ...(status ? { status } : {}),
  };

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

/**
 * GET /event-registrations/:id
 */
export const getById: RequestHandler = asyncWrap(async (req, res) => {
  const { id } = eventRegistrationIdParam.parse(req.params);
  const item = await prisma.eventRegistration.findUnique({
    where: { id },
    include: { event: true, customer: true },
  });
  if (!item) throw new HttpError(404, "Event registration not found");
  res.json(item);
});

/**
 * POST /event-registrations
 * Body: { eventId, customerId }
 */
export const registerPublic: RequestHandler = asyncWrap(async (req, res) => {
  const data = registerEventSchema.parse(req.body);
  const exists = await prisma.eventRegistration.findFirst({
    where: { eventId: data.eventId, customerId: data.customerId },
  });
  if (exists) throw new HttpError(409, "Already registered for this event");
  const created = await prisma.eventRegistration.create({ data });
  res.status(201).json(created);
});

/**
 * POST /event-registrations/join
 * - Interdit: FRANCHISEE, ADMIN/ADMINISTRATOR
 * - Ne demande PAS customerId (dérivé de req.user)
 * - Auto-crée un Customer si nécessaire
 * - Refuse l’inscription à un event non public
 */
export const join: RequestHandler = asyncWrap(async (req, res) => {
  // ✅ on réutilise le schema existant, en ne gardant que eventId
  const joinBodySchema = registerEventSchema.pick({ eventId: true });
  const { eventId } = joinBodySchema.parse(req.body);

  const me = (req as any).user as any;
  if (!me?.id) throw new HttpError(401, "Unauthenticated");

  const roles: string[] = (me.roles ?? (me.role ? [me.role] : []))
    .map((r: any) => String(r).toUpperCase());
  if (roles.includes("FRANCHISEE") || roles.includes("ADMIN") || roles.includes("ADMINISTRATOR")) {
    throw new HttpError(403, "Forbidden");
  }

  // Vérifie l’existence de l’événement et qu’il est public
  const ev = await prisma.event.findUnique({
    where: { id: eventId },
    select: { id: true, isPublic: true },
  });
  if (!ev) throw new HttpError(404, "Event not found");
  if (!ev.isPublic) throw new HttpError(403, "Event is not public");

  // Récupère (ou crée) le customer associé à l’utilisateur
  let customerId: string | null = me.customerId ?? me.customer?.id ?? null;
  if (!customerId) {
    const user = await prisma.user.findUnique({
      where: { id: me.id },
      include: { customer: true },
    });
    if (user?.customer?.id) {
      customerId = user.customer.id;
    } else {
      const createdCustomer = await prisma.customer.create({
        data: { user: { connect: { id: me.id } } },
      });
      customerId = createdCustomer.id;
    }
  }

  // Empêche les doublons (eventId + customerId)
  const exists = await prisma.eventRegistration.findFirst({
    where: { eventId, customerId: customerId! },
  });
  if (exists) return res.status(409).json({ message: "Already registered" });

  const created = await prisma.eventRegistration.create({
    data: { eventId, customerId: customerId! },
  });

  res.status(201).json(created);
});

/**
 * PUT /event-registrations/:id
 */
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

/**
 * DELETE /event-registrations/:id (cancel)
 */
export const cancel: RequestHandler = asyncWrap(async (req, res) => {
  const { id } = eventRegistrationIdParam.parse(req.params);
  const updated = await prisma.eventRegistration.update({
    where: { id },
    data: { status: "CANCELLED" },
  });
  res.json(updated);
});
