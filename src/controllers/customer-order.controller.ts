import type { RequestHandler } from "express";
import { PrismaClient, Prisma } from "@prisma/client";
import { asyncWrap, HttpError } from "../utils/handlers.js";
import {
  createCustomerOrderSchema,
  updateCustomerOrderStatusSchema,
  listCustomerOrderQuerySchema,
  coIdParam,
} from "../validators/customer-order.validators.js";

const prisma = new PrismaClient();

export const list: RequestHandler = asyncWrap(async (req, res) => {
  const { page = 1, pageSize = 20, status, franchiseeId, customerId } = listCustomerOrderQuerySchema.parse(req.query);
  const where: any = {};
  if (status) where.status = status;
  if (franchiseeId) where.franchiseeId = franchiseeId;
  if (customerId) where.customerId = customerId;

  const [items, total] = await Promise.all([
    prisma.customerOrder.findMany({
      where,
      include: { customer: true, franchisee: true },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { placedAt: "desc" },
    }),
    prisma.customerOrder.count({ where }),
  ]);

  res.json({ items, page, pageSize, total });
});

export const getById: RequestHandler = asyncWrap(async (req, res) => {
  const { id } = coIdParam.parse(req.params);
  const item = await prisma.customerOrder.findUnique({
    where: { id },
    include: { lines: { include: { menuItem: true } }, payments: true, invoice: true },
  });
  if (!item) throw new HttpError(404, "Customer order not found");
  res.json(item);
});

export const create: RequestHandler = asyncWrap(async (req, res) => {
  const data = createCustomerOrderSchema.parse(req.body);

  // Déstructure les optionnels puis ne les ajoute que s’ils sont définis
  const {
    truckId,
    warehouseId,
    scheduledPickupAt,
    ...required // customerId, franchiseeId, channel, totalHT, totalTVA, totalTTC, etc.
  } = data;

  const payload: Prisma.CustomerOrderUncheckedCreateInput = {
    ...required,
    ...(truckId ? { truckId } : {}),
    ...(warehouseId ? { warehouseId } : {}),
    ...(scheduledPickupAt ? { scheduledPickupAt } : {}),
  };

  const created = await prisma.customerOrder.create({ data: payload });
  res.status(201).json(created);
});

export const updateStatus: RequestHandler = asyncWrap(async (req, res) => {
  const { id } = coIdParam.parse(req.params);
  const { status } = updateCustomerOrderStatusSchema.parse(req.body);
  const updated = await prisma.customerOrder.update({ where: { id }, data: { status } });
  res.json(updated);
});

export const cancel: RequestHandler = asyncWrap(async (req, res) => {
  const { id } = coIdParam.parse(req.params);
  const co = await prisma.customerOrder.findUnique({ where: { id } });
  if (!co) throw new HttpError(404, "Customer order not found");
  if (["FULFILLED","CANCELLED"].includes(co.status)) {
    throw new HttpError(409, "Order cannot be cancelled");
  }
  await prisma.customerOrder.update({ where: { id }, data: { status: "CANCELLED" } });
  res.status(204).end();
});
