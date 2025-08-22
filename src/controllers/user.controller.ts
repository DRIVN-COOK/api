import type { RequestHandler } from "express";
import { PrismaClient, Prisma } from "@prisma/client";
import { asyncWrap, HttpError } from "../utils/handlers.js";
import {
  createUserSchema,
  updateUserSchema,
  listUserQuerySchema,
  userIdParam,
} from "../validators/user.validators.js";

const prisma = new PrismaClient();

export const list: RequestHandler = asyncWrap(async (req, res) => {
  const { page = 1, pageSize = 20, q } = listUserQuerySchema.parse(req.query);

  const where: Prisma.UserWhereInput = q
    ? {
        OR: [
          { email: { contains: q, mode: "insensitive" } },
          { firstName: { contains: q, mode: "insensitive" } },
          { lastName: { contains: q, mode: "insensitive" } },
        ],
      }
    : {};

  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.count({ where }),
  ]);

  res.json({ items, page, pageSize, total });
});

export const getById: RequestHandler = asyncWrap(async (req, res) => {
  const { id } = userIdParam.parse(req.params);
  const item = await prisma.user.findUnique({ where: { id } });
  if (!item) throw new HttpError(404, "User not found");
  res.json(item);
});

export const create: RequestHandler = asyncWrap(async (req, res) => {
  const data = createUserSchema.parse(req.body);

  // unicité email
  const exists = await prisma.user.findUnique({ where: { email: data.email } });
  if (exists) throw new HttpError(409, "Email already used");

  const payload: Prisma.UserCreateInput = {
    email: data.email,
    passwordHash: data.passwordHash,
    role: data.role,
    firstName: data.firstName ?? null, // nullable => jamais undefined
    lastName: data.lastName ?? null,   // nullable => jamais undefined
  };

  const created = await prisma.user.create({ data: payload });
  res.status(201).json(created);
});

export const update: RequestHandler = asyncWrap(async (req, res) => {
  const { id } = userIdParam.parse(req.params);
  const data = updateUserSchema.parse(req.body);

  const payload: Prisma.UserUpdateInput = {
    ...(data.email !== undefined ? { email: { set: data.email } } : {}),
    ...(data.passwordHash !== undefined ? { passwordHash: { set: data.passwordHash } } : {}),
    ...(data.role !== undefined ? { role: { set: data.role } } : {}),
    ...(data.firstName !== undefined ? { firstName: { set: data.firstName ?? null } } : {}),
    ...(data.lastName !== undefined ? { lastName: { set: data.lastName ?? null } } : {}),
  };

  const updated = await prisma.user.update({ where: { id }, data: payload });
  res.json(updated);
});

export const remove: RequestHandler = asyncWrap(async (req, res) => {
  const { id } = userIdParam.parse(req.params);
  await prisma.user.delete({ where: { id } });
  res.status(204).end();
});
