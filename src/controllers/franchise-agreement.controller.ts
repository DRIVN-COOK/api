import type { RequestHandler } from "express";
import { PrismaClient, Prisma } from "@prisma/client";
import { asyncWrap, HttpError } from "../utils/handlers.js";
import {
  createFranchiseAgreementSchema,
  updateFranchiseAgreementSchema,
  listFranchiseAgreementQuerySchema,
  franchiseAgreementIdParam,
} from "../validators/franchise-agreement.validators.js";

const prisma = new PrismaClient();

/**
 * GET /franchise-agreements
 */
export const list: RequestHandler = asyncWrap(async (req, res) => {
  const { page = 1, pageSize = 20, franchiseeId } =
    listFranchiseAgreementQuerySchema.parse(req.query);

  const where: Prisma.FranchiseAgreementWhereInput = {
    ...(franchiseeId ? { franchiseeId } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.franchiseAgreement.findMany({
      where,
      include: { franchisee: true },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { startDate: "desc" },
    }),
    prisma.franchiseAgreement.count({ where }),
  ]);

  res.json({ items, page, pageSize, total });
});

/**
 * GET /franchise-agreements/:id
 */
export const getById: RequestHandler = asyncWrap(async (req, res) => {
  const { id } = franchiseAgreementIdParam.parse(req.params);
  const item = await prisma.franchiseAgreement.findUnique({
    where: { id },
    include: { franchisee: true },
  });
  if (!item) throw new HttpError(404, "Agreement not found");
  res.json(item);
});

/**
 * POST /franchise-agreements
 */
export const create: RequestHandler = asyncWrap(async (req, res) => {
  const data = createFranchiseAgreementSchema.parse(req.body);

  // Eventuels champs nullable → null (jamais undefined)
  const payload: Prisma.FranchiseAgreementCreateInput = {
    franchisee: { connect: { id: data.franchiseeId } },
    startDate: data.startDate,
    endDate: data.endDate ?? null, // Date | null
    entryFeeAmount: data.entryFeeAmount, // Decimal | number | string → OK
    revenueSharePct: data.revenueSharePct, // Decimal | number | string → OK
    notes: data.notes ?? null, // string | null
  };

  const created = await prisma.franchiseAgreement.create({
    data: payload,
    include: { franchisee: true },
  });
  res.status(201).json(created);
});

/**
 * PATCH /franchise-agreements/:id
 */
export const update: RequestHandler = asyncWrap(async (req, res) => {
  const { id } = franchiseAgreementIdParam.parse(req.params);
  const data = updateFranchiseAgreementSchema.parse(req.body);

  // Relations (seulement si fournies)
  const relationPart: Prisma.FranchiseAgreementUpdateInput = {
    ...(data.franchiseeId !== undefined
      ? { franchisee: { connect: { id: data.franchiseeId } } }
      : {}),
  };

  // Scalars : n'envoyer que si présent, et utiliser { set: ... } (null pour les nullable)
  const scalarPart: Prisma.FranchiseAgreementUpdateInput = {
    ...(data.startDate !== undefined ? { startDate: { set: data.startDate } } : {}),
    ...(data.endDate !== undefined ? { endDate: { set: data.endDate ?? null } } : {}),
    ...(data.entryFeeAmount !== undefined
      ? { entryFeeAmount: { set: data.entryFeeAmount } }
      : {}),
    ...(data.revenueSharePct !== undefined
      ? { revenueSharePct: { set: data.revenueSharePct } }
      : {}),
    ...(data.notes !== undefined ? { notes: { set: data.notes ?? null } } : {}),
  };

  const payload: Prisma.FranchiseAgreementUpdateInput = {
    ...relationPart,
    ...scalarPart,
  };

  if (Object.keys(payload).length === 0) {
    throw new HttpError(400, "No fields to update");
  }

  const updated = await prisma.franchiseAgreement.update({
    where: { id },
    data: payload,
    include: { franchisee: true },
  });

  res.json(updated);
});

/**
 * DELETE /franchise-agreements/:id
 */
export const remove: RequestHandler = asyncWrap(async (req, res) => {
  const { id } = franchiseAgreementIdParam.parse(req.params);
  await prisma.franchiseAgreement.delete({ where: { id } });
  res.status(204).end();
});
