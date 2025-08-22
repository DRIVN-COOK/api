import type { RequestHandler } from "express";
import { PrismaClient } from "@prisma/client";
import { asyncWrap } from "../utils/handlers.js";
import {
  listSalesSummaryQuerySchema,
  salesSummaryIdParam,
  rebuildSummarySchema,
} from "../validators/sales-summary.validators.js";

const prisma = new PrismaClient();

export const list: RequestHandler = asyncWrap(async (req, res) => {
  const { page = 1, pageSize = 20, franchiseeId, period } = listSalesSummaryQuerySchema.parse(req.query);
  const where: any = {};
  if (franchiseeId) where.franchiseeId = franchiseeId;
  if (period) where.period = period;

  const [items, total] = await Promise.all([
    prisma.salesSummary.findMany({
      where,
      include: { franchisee: true },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: "desc" },
    }),
    prisma.salesSummary.count({ where }),
  ]);

  res.json({ items, page, pageSize, total });
});

export const getById: RequestHandler = asyncWrap(async (req, res) => {
  const { id } = salesSummaryIdParam.parse(req.params);
  const item = await prisma.salesSummary.findUnique({ where: { id } });
  res.json(item);
});

export const rebuildPeriod: RequestHandler = asyncWrap(async (req, res) => {
  const { franchiseeId, period } = rebuildSummarySchema.parse(req.body);
  // placeholder: calcul d’agrégats (à brancher avec tes règles de CA)
  // Ici on retourne juste un message de succès.
  res.json({ ok: true, franchiseeId: franchiseeId ?? null, period: period ?? "all" });
});