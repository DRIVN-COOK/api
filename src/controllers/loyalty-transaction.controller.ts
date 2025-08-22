import type { RequestHandler } from "express";
import { PrismaClient, Prisma } from "@prisma/client";
import { asyncWrap, HttpError } from "../utils/handlers.js";
import {
  earnOrSpendSchema,
  listLoyaltyTxnQuerySchema,
  loyaltyTxnIdParam,
} from "../validators/loyalty-transaction.validators.js";

const prisma = new PrismaClient();

export const list: RequestHandler = asyncWrap(async (req, res) => {
  const { page = 1, pageSize = 20, loyaltyCardId, customerId } =
    listLoyaltyTxnQuerySchema.parse(req.query);

  // Toujours fournir un objet pour `where`
  const where: Prisma.LoyaltyTransactionWhereInput = {
    ...(loyaltyCardId ? { loyaltyCardId } : {}),
    ...(customerId ? { customerId } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.loyaltyTransaction.findMany({
      where,
      include: { loyaltyCard: true, customer: true },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: "desc" },
    }),
    prisma.loyaltyTransaction.count({ where }),
  ]);

  res.json({ items, page, pageSize, total });
});

export const getById: RequestHandler = asyncWrap(async (req, res) => {
  const { id } = loyaltyTxnIdParam.parse(req.params);
  const item = await prisma.loyaltyTransaction.findUnique({
    where: { id },
    include: { loyaltyCard: true, customer: true },
  });
  if (!item) throw new HttpError(404, "Loyalty transaction not found");
  res.json(item);
});

export const earnOrSpend: RequestHandler = asyncWrap(async (req, res) => {
  const data = earnOrSpendSchema.parse(req.body);

  // IMPORTANT:
  // - FKs en "checked" input -> relations .connect
  // - Champs nullable -> `?? null` (jamais undefined)
  const payload: Prisma.LoyaltyTransactionCreateInput = {
    loyaltyCard: { connect: { id: data.loyaltyCardId } },
    ...(data.customerId !== undefined ? { customer: { connect: { id: data.customerId } } } : {}),
    type: data.type,
    points: data.points,
    refType: data.refType ?? null,
    refId: data.refId ?? null,
  };

  const created = await prisma.loyaltyTransaction.create({
    data: payload,
    include: { loyaltyCard: true, customer: true },
  });

  res.status(201).json(created);
});

export const revert: RequestHandler = asyncWrap(async (req, res) => {
  const { id } = loyaltyTxnIdParam.parse(req.params);
  await prisma.loyaltyTransaction.delete({ where: { id } });
  res.status(204).end();
});
