import type { RequestHandler } from "express";
import { PrismaClient, Prisma, Role as PrismaRole } from "@prisma/client";
import { asyncWrap, HttpError } from "../utils/handlers.js";
import {
  createUserSchema,
  updateUserSchema,
  listUserQuerySchema,
  userIdParam,
} from "../validators/user.validators.js";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export const list: RequestHandler = asyncWrap(async (req, res) => {
  const { page, pageSize, q, role } = listUserQuerySchema.parse(req.query);

  const where: Prisma.UserWhereInput = {
    AND: [
      role ? { role } : {},
      q
        ? {
            OR: [
              { email:     { contains: q, mode: 'insensitive' } },
              { firstName: { contains: q, mode: 'insensitive' } },
              { lastName:  { contains: q, mode: 'insensitive' } },
            ],
          }
        : {},
    ],
  };

  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, email: true, firstName: true, lastName: true, role: true,
        createdAt: true, updatedAt: true,
      },
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
  // 1) Supporte `password` OU `passwordHash` (compat rétro)
  const passwordHash =
    typeof req.body.password === 'string' && req.body.password.length > 0
      ? await bcrypt.hash(req.body.password, 12)
      : (typeof req.body.passwordHash === 'string' ? req.body.passwordHash : null);

  if (!passwordHash) {
    throw new HttpError(400, 'Password is required');
  }

  // 2) On ne valide que les champs attendus par le schema (évite un .strict() qui casse)
  const data = createUserSchema.parse({
    email: req.body.email,
    passwordHash,
    role: req.body.role,
    firstName: req.body.firstName ?? null, // nullable => jamais undefined
    lastName: req.body.lastName ?? null,   // nullable => jamais undefined
  });

  // 3) Unicité email
  const exists = await prisma.user.findUnique({ where: { email: data.email } });
  if (exists) throw new HttpError(409, 'Email already used');

  // 4) Création + on NE renvoie PAS le hash
  const created = await prisma.user.create({
  data: {
    email: data.email,
    passwordHash: data.passwordHash,
    role: data.role,
    firstName: data.firstName ?? null,
    lastName:  data.lastName  ?? null,
  },
  select: {
    id: true, email: true, firstName: true, lastName: true,
    role: true, createdAt: true, updatedAt: true,
  },
});
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
