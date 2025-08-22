// src/controllers/payment.controller.ts
import type { RequestHandler } from "express";
import { PrismaClient, Prisma } from "@prisma/client";
import { asyncWrap } from "../utils/handlers.js";
import {
  createPaymentSchema,
  updatePaymentSchema,
  listPaymentQuerySchema,
  paymentIdParam,
} from "../validators/payment.validators.js";

const prisma = new PrismaClient();

export const list: RequestHandler = asyncWrap(async (req, res) => {
  const { page = 1, pageSize = 20, customerOrderId, status } = listPaymentQuerySchema.parse(req.query);
  const where: Prisma.PaymentWhereInput = {
    ...(customerOrderId ? { customerOrderId } : {}),
    ...(status ? { status } : {}),
  };
  const [items, total] = await Promise.all([
    prisma.payment.findMany({ where, skip: (page - 1) * pageSize, take: pageSize, orderBy: { createdAt: "desc" } }),
    prisma.payment.count({ where }),
  ]);
  res.json({ items, page, pageSize, total });
});

export const getById: RequestHandler = asyncWrap(async (req, res) => {
  const { id } = paymentIdParam.parse(req.params);
  const item = await prisma.payment.findUnique({ where: { id } });
  if (!item) return res.status(404).json({ message: "Payment not found" });
  res.json(item);
});

export const create: RequestHandler = asyncWrap(async (req, res) => {
  const data = createPaymentSchema.parse(req.body);
  const created = await prisma.payment.create({ data }); // schema déjà bon pour Prisma.CreateInput
  res.status(201).json(created);
});


export const update: RequestHandler = asyncWrap(async (req, res) => {
  const { id } = paymentIdParam.parse(req.params);
  const { status, transactionRef } = updatePaymentSchema.parse(req.body);

  const data: Prisma.PaymentUpdateInput = {};
  if (status !== undefined) data.status = status;
  if (transactionRef !== undefined) data.transactionRef = transactionRef ?? null;

  const updated = await prisma.payment.update({ where: { id }, data });
  res.json(updated);
});

export const remove: RequestHandler = asyncWrap(async (req, res) => {
  const { id } = paymentIdParam.parse(req.params);
  await prisma.payment.delete({ where: { id } });
  res.status(204).end();
});

export const capture: RequestHandler = asyncWrap(async (req, res) => {
  const { id } = paymentIdParam.parse(req.params);
  const updated = await prisma.payment.update({ where: { id }, data: { status: "PAID", paidAt: new Date() } });
  res.json(updated);
});

export const refund: RequestHandler = asyncWrap(async (req, res) => {
  const { id } = paymentIdParam.parse(req.params);
  const updated = await prisma.payment.update({ where: { id }, data: { status: "REFUNDED" } });
  res.json(updated);
});
