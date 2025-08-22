import type { RequestHandler } from "express";
import { PrismaClient, Prisma } from "@prisma/client";
import { asyncWrap, HttpError } from "../utils/handlers.js";
import {
  issueInvoiceSchema,
  listInvoiceQuerySchema,
  invoiceIdParam,
} from "../validators/invoice.validators.js";

const prisma = new PrismaClient();

export const list: RequestHandler = asyncWrap(async (req, res) => {
  const { page = 1, pageSize = 20, customerOrderId } =
    listInvoiceQuerySchema.parse(req.query);

  // IMPORTANT: never pass `undefined` to `where` with exactOptionalPropertyTypes
  const where: Prisma.InvoiceWhereInput = customerOrderId
    ? { customerOrderId }
    : {};

  const [items, total] = await Promise.all([
    prisma.invoice.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { issuedAt: "desc" },
    }),
    prisma.invoice.count({ where }),
  ]);

  res.json({ items, page, pageSize, total });
});

export const getById: RequestHandler = asyncWrap(async (req, res) => {
  const { id } = invoiceIdParam.parse(req.params);
  const item = await prisma.invoice.findUnique({ where: { id } });
  if (!item) throw new HttpError(404, "Invoice not found");
  res.json(item);
});

export const issue: RequestHandler = asyncWrap(async (req, res) => {
  const data = issueInvoiceSchema.parse(req.body);
  // Si ton schema contient des champs nullable (ex: pdfUrl), veille à envoyer `null` plutôt qu'`undefined`.
  // Ici on renvoie `data` tel quel si ton validator garantit déjà l’absence d'`undefined`.
  const created = await prisma.invoice.create({ data });
  res.status(201).json(created);
});

export const getPdf: RequestHandler = asyncWrap(async (req, res) => {
  const { id } = invoiceIdParam.parse(req.params);
  const inv = await prisma.invoice.findUnique({ where: { id } });
  if (!inv) throw new HttpError(404, "Invoice not found");
  res.json({ pdfUrl: inv.pdfUrl ?? null });
});
