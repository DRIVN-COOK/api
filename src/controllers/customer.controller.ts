import type { RequestHandler } from "express";
import { PrismaClient, Prisma } from "@prisma/client";
import { asyncWrap, HttpError } from "../utils/handlers.js";
import {
  createCustomerSchema,
  updateCustomerSchema,
  listCustomerQuerySchema,
  customerIdParam,
} from "../validators/customer.validators.js";

const prisma = new PrismaClient();

export const list: RequestHandler = asyncWrap(async (req, res) => {
  const { page = 1, pageSize = 20, q } = listCustomerQuerySchema.parse(req.query);

  const where: Prisma.CustomerWhereInput = q
    ? {
        OR: [
          { defaultCity: { contains: q, mode: "insensitive" } },
          { defaultZip: { contains: q, mode: "insensitive" } },
        ],
      }
    : {};

  const [items, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      include: { user: true, loyaltyCard: true },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: "desc" },
    }),
    prisma.customer.count({ where }),
  ]);

  res.json({ items, page, pageSize, total });
});

export const getById: RequestHandler = asyncWrap(async (req, res) => {
  const { id } = customerIdParam.parse(req.params);
  const item = await prisma.customer.findUnique({
    where: { id },
    include: { user: true, loyaltyCard: true },
  });
  if (!item) return res.status(404).json({ message: "Customer not found" });
  res.json(item);
});

export const create: RequestHandler = asyncWrap(async (req, res) => {
  const data = createCustomerSchema.parse(req.body);

  // 1 user -> 1 customer
  const exists = await prisma.customer.findUnique({ where: { userId: data.userId } });
  if (exists) return res.status(409).json({ message: "Customer for this user already exists" });

  // CustomerCreateInput attend string | null pour les champs nullable (pas undefined)
  const payload: Prisma.CustomerCreateInput = {
    user: { connect: { id: data.userId } },
    ...(data.phone !== undefined ? { phone: data.phone ?? null } : {}),
    ...(data.defaultCity !== undefined ? { defaultCity: data.defaultCity ?? null } : {}),
    ...(data.defaultZip !== undefined ? { defaultZip: data.defaultZip ?? null } : {}),
  };

  const created = await prisma.customer.create({
    data: payload,
    include: { user: true, loyaltyCard: true },
  });
  res.status(201).json(created);
});

export const update: RequestHandler = asyncWrap(async (req, res) => {
  const { id } = customerIdParam.parse(req.params);
  const data = updateCustomerSchema.parse(req.body);

  // CustomerUpdateInput : utiliser { set: value|null } pour éviter 'undefined'
  const payload: Prisma.CustomerUpdateInput = {
    ...(data.phone !== undefined ? { phone: { set: data.phone ?? null } } : {}),
    ...(data.defaultCity !== undefined ? { defaultCity: { set: data.defaultCity ?? null } } : {}),
    ...(data.defaultZip !== undefined ? { defaultZip: { set: data.defaultZip ?? null } } : {}),
  };

  if (Object.keys(payload).length === 0) {
    throw new HttpError(400, "No fields to update");
  }

  const updated = await prisma.customer.update({
    where: { id },
    data: payload,
    include: { user: true, loyaltyCard: true },
  });

  res.json(updated);
});

export const remove: RequestHandler = asyncWrap(async (req, res) => {
  const { id } = customerIdParam.parse(req.params);
  await prisma.customer.delete({ where: { id } });
  res.status(204).end();
});
