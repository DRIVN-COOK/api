// src/controllers/user.controller.ts
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

// petite aide: détecte grossièrement un hash bcrypt
const looksLikeBcrypt = (s: unknown) =>
  typeof s === "string" && s.length >= 55 && (s.startsWith("$2a$") || s.startsWith("$2b$") || s.startsWith("$2y$"));

export const list: RequestHandler = asyncWrap(async (req, res) => {
  const { page, pageSize, q, role } = listUserQuerySchema.parse(req.query);

  const where: Prisma.UserWhereInput = {
    AND: [
      role ? { role } : undefined,
      q
        ? {
            OR: [
              { email:     { contains: q, mode: 'insensitive' } },
              { firstName: { contains: q, mode: 'insensitive' } },
              { lastName:  { contains: q, mode: 'insensitive' } },
            ],
          }
        : undefined,
    ].filter(Boolean) as Prisma.UserWhereInput[],
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
  // 1) password (clair) prioritaire ; sinon passwordHash si fourni
  let finalHash: string | null = null;

  if (typeof req.body.password === "string" && req.body.password.length > 0) {
    finalHash = await bcrypt.hash(req.body.password, 12);
  } else if (typeof req.body.passwordHash === "string" && req.body.passwordHash.length > 0) {
    // si c'est déjà un bcrypt, on garde ; sinon on hash (utile pour tes tests qui envoient "hashed_password_12345")
    finalHash = looksLikeBcrypt(req.body.passwordHash)
      ? req.body.passwordHash
      : await bcrypt.hash(req.body.passwordHash, 12);
  }

  if (!finalHash) throw new HttpError(400, "Password is required");

  // 2) Ne pas forcer les champs optionnels à null : on ne les inclut que s'ils existent
  const parsed = createUserSchema.parse({
    email: req.body.email,
    passwordHash: finalHash,
    role: req.body.role as PrismaRole,
    ...(req.body.firstName !== undefined ? { firstName: req.body.firstName } : {}),
    ...(req.body.lastName  !== undefined ? { lastName:  req.body.lastName  } : {}),
  });

  // 3) Unicité email
  const exists = await prisma.user.findUnique({ where: { email: parsed.email } });
  if (exists) throw new HttpError(409, "Email already used");

  // 4) Création (sans renvoyer le hash)
  const created = await prisma.user.create({
    data: {
      email: parsed.email,
      passwordHash: parsed.passwordHash,
      role: parsed.role,
      ...(parsed.firstName !== undefined ? { firstName: parsed.firstName } : {}),
      ...(parsed.lastName  !== undefined ? { lastName:  parsed.lastName  } : {}),
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

  const payload: Prisma.UserUpdateInput = {};

  if (data.email !== undefined)        payload.email        = data.email;               // string OK
  if (data.passwordHash !== undefined) payload.passwordHash = data.passwordHash;        // string OK
  if (data.role !== undefined)         payload.role         = data.role as PrismaRole;  // enum OK
  if (data.firstName !== undefined)    payload.firstName    = data.firstName ?? null;   // string | null
  if (data.lastName !== undefined)     payload.lastName     = data.lastName  ?? null;   // string | null

  const updated = await prisma.user.update({ where: { id }, data: payload });
  res.json(updated);
});

export const remove: RequestHandler = asyncWrap(async (req, res) => {
  const { id } = userIdParam.parse(req.params);
  await prisma.user.delete({ where: { id } });
  res.status(204).end();
});
