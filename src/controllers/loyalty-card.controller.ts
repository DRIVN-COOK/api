import type { RequestHandler } from "express";
import { PrismaClient, Prisma } from "@prisma/client";
import { asyncWrap, HttpError } from "../utils/handlers.js";
import {
  createLoyaltyCardSchema,
  updateLoyaltyCardSchema,
  listLoyaltyCardQuerySchema,
  loyaltyCardIdParam,
} from "../validators/loyalty-card.validators.js";

const prisma = new PrismaClient();

export const list: RequestHandler = asyncWrap(async (req, res) => {
  const { page = 1, pageSize = 20, customerId, cardNumber } =
    listLoyaltyCardQuerySchema.parse(req.query);

  const where: Prisma.LoyaltyCardWhereInput = {
    ...(customerId ? { customerId } : {}),
    ...(cardNumber ? { cardNumber } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.loyaltyCard.findMany({
      where,
      include: { customer: true },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: "desc" },
    }),
    prisma.loyaltyCard.count({ where }),
  ]);

  res.json({ items, page, pageSize, total });
});

export const getById: RequestHandler = asyncWrap(async (req, res) => {
  const { id } = loyaltyCardIdParam.parse(req.params);
  const item = await prisma.loyaltyCard.findUnique({
    where: { id },
    include: { customer: true },
  });
  if (!item) throw new HttpError(404, "LoyaltyCard not found");
  res.json(item);
});

export const create: RequestHandler = asyncWrap(async (req, res) => {
  const data = createLoyaltyCardSchema.parse(req.body);

  const payload: Prisma.LoyaltyCardCreateInput = {
    customer: { connect: { id: data.customerId } }, // FK -> relation
    cardNumber: data.cardNumber,
    points: data.points,
    tier: data.tier,
    printablePdfUrl: data.printablePdfUrl ?? null, // nullable -> jamais undefined
  };

  const created = await prisma.loyaltyCard.create({
    data: payload,
    include: { customer: true },
  });
  res.status(201).json(created);
});

export const update: RequestHandler = asyncWrap(async (req, res) => {
  const { id } = loyaltyCardIdParam.parse(req.params);
  const data = updateLoyaltyCardSchema.parse(req.body);

  const relationPart: Prisma.LoyaltyCardUpdateInput = {
    ...(data.customerId !== undefined
      ? { customer: { connect: { id: data.customerId } } }
      : {}),
  };

  const scalarPart: Prisma.LoyaltyCardUpdateInput = {
    ...(data.cardNumber !== undefined ? { cardNumber: { set: data.cardNumber } } : {}),
    ...(data.points !== undefined ? { points: { set: data.points } } : {}),
    ...(data.tier !== undefined ? { tier: { set: data.tier } } : {}),
    ...(data.printablePdfUrl !== undefined
      ? { printablePdfUrl: { set: data.printablePdfUrl ?? null } }
      : {}),
  };

  const payload: Prisma.LoyaltyCardUpdateInput = {
    ...relationPart,
    ...scalarPart,
  };

  if (Object.keys(payload).length === 0) {
    throw new HttpError(400, "No fields to update");
  }

  const updated = await prisma.loyaltyCard.update({
    where: { id },
    data: payload,
    include: { customer: true },
  });

  res.json(updated);
});

export const remove: RequestHandler = asyncWrap(async (req, res) => {
  const { id } = loyaltyCardIdParam.parse(req.params);
  await prisma.loyaltyCard.delete({ where: { id } });
  res.status(204).end();
});
