import type { RequestHandler } from "express";
import { PrismaClient } from "@prisma/client";
import { asyncWrap, HttpError } from "../utils/handlers.js";
import {
  listRevenueShareReportQuerySchema,
  revenueShareReportIdParam,
  generateReportSchema,
} from "../validators/revenue-share-report.validators.js";

const prisma = new PrismaClient();

export const list: RequestHandler = asyncWrap(async (req, res) => {
  const { page = 1, pageSize = 20, franchiseeId, period } = listRevenueShareReportQuerySchema.parse(req.query);
  const where: any = {};
  if (franchiseeId) where.franchiseeId = franchiseeId;
  if (period) where.period = period;

  const [items, total] = await Promise.all([
    prisma.revenueShareReport.findMany({
      where,
      include: { franchisee: true },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: "desc" },
    }),
    prisma.revenueShareReport.count({ where }),
  ]);

  res.json({ items, page, pageSize, total });
});

export const getById: RequestHandler = asyncWrap(async (req, res) => {
  const { id } = revenueShareReportIdParam.parse(req.params);
  const item = await prisma.revenueShareReport.findUnique({ where: { id } });
  if (!item) throw new HttpError(404, "Report not found");
  res.json(item);
});

export const generateForPeriod: RequestHandler = asyncWrap(async (req, res) => {
  const { franchiseeId, period } = generateReportSchema.parse(req.body);
  // placeholder: calcul amountDue = grossSales * sharePct
  const created = await prisma.revenueShareReport.create({
    data: {
      franchiseeId,
      period,
      grossSales: 0,
      sharePct: 0.04,
      amountDue: 0,
    },
  });
  res.status(201).json(created);
});

export const getPdf: RequestHandler = asyncWrap(async (req, res) => {
  const { id } = revenueShareReportIdParam.parse(req.params);
  const item = await prisma.revenueShareReport.findUnique({ where: { id } });
  if (!item) throw new HttpError(404, "Report not found");
  res.json({ pdfUrl: item.generatedPdfUrl ?? null });
});