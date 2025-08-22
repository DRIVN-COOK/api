import type { RequestHandler } from "express";
import { PrismaClient, Prisma } from "@prisma/client";
import { asyncWrap, HttpError } from "../utils/handlers.js";
import {
  createCustomerOrderLineSchema,
  updateCustomerOrderLineSchema,
  listCustomerOrderLineQuerySchema,
  customerOrderLineIdParam,
} from "../validators/customer-order-line.validators.js";

const prisma = new PrismaClient();

export const list: RequestHandler = asyncWrap(async (req, res) => {
  const { page = 1, pageSize = 20, customerOrderId } =
    listCustomerOrderLineQuerySchema.parse(req.query);

  const where: Prisma.CustomerOrderLineWhereInput = customerOrderId
    ? { customerOrderId }
    : {}; // objet vide OK

  const [items, total] = await Promise.all([
    prisma.customerOrderLine.findMany({
      where,
      include: { menuItem: true },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { id: "desc" },
    }),
    prisma.customerOrderLine.count({ where }),
  ]);

  res.json({ items, page, pageSize, total });
});

export const getById: RequestHandler = asyncWrap(async (req, res) => {
  const { id } = customerOrderLineIdParam.parse(req.params);
  const item = await prisma.customerOrderLine.findUnique({
    where: { id },
    include: { menuItem: true, order: true },
  });
  if (!item) throw new HttpError(404, "Order line not found");
  res.json(item);
});

export const addLine: RequestHandler = asyncWrap(async (req, res) => {
  const data = createCustomerOrderLineSchema.parse(req.body);
  // Si ton schema de création fournit directement les FKs, Prisma les accepte en "unchecked".
  // Sinon, mappe comme dans update (connect) selon ton validator.
  const created = await prisma.customerOrderLine.create({
    data,
    include: { menuItem: true, order: true },
  });
  res.status(201).json(created);
});

export const updateLine: RequestHandler = asyncWrap(async (req, res) => {
  const { id } = customerOrderLineIdParam.parse(req.params);
  const payload = updateCustomerOrderLineSchema.parse(req.body);

  // Construire un CustomerOrderLineUpdateInput strict : on n’envoie que les champs définis
  const data: Prisma.CustomerOrderLineUpdateInput = {
    ...(payload.qty !== undefined ? { qty: payload.qty } : {}),
    ...(payload.unitPriceHT !== undefined ? { unitPriceHT: payload.unitPriceHT } : {}),
    ...(payload.tvaPct !== undefined ? { tvaPct: payload.tvaPct } : {}),
    ...(payload.lineTotalHT !== undefined ? { lineTotalHT: payload.lineTotalHT } : {}),
    // Les FKs doivent passer par les relations lorsqu’on utilise l’UpdateInput "sécurisé"
    ...(payload.menuItemId !== undefined
      ? { menuItem: { connect: { id: payload.menuItemId } } }
      : {}),
    ...(payload.customerOrderId !== undefined
      ? { order: { connect: { id: payload.customerOrderId } } }
      : {}),
  };

  if (Object.keys(data).length === 0) {
    throw new HttpError(400, "No fields to update");
  }

  const updated = await prisma.customerOrderLine.update({
    where: { id },
    data,
    include: { menuItem: true, order: true },
  });

  res.json(updated);
});

export const removeLine: RequestHandler = asyncWrap(async (req, res) => {
  const { id } = customerOrderLineIdParam.parse(req.params);
  await prisma.customerOrderLine.delete({ where: { id } });
  res.status(204).end();
});
