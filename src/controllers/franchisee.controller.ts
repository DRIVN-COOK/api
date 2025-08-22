import type { RequestHandler } from "express";
import { PrismaClient, Prisma } from "@prisma/client";
import { asyncWrap, HttpError } from "../utils/handlers.js";
import {
  createFranchiseeSchema,
  updateFranchiseeSchema,
  listFranchiseeQuerySchema,
  franchiseeIdParam,
} from "../validators/franchisee.validators.js";

const prisma = new PrismaClient();

// GET /franchisees
export const list: RequestHandler = asyncWrap(async (req, res) => {
  const { page = 1, pageSize = 20, q } = listFranchiseeQuerySchema.parse(req.query);

  // Toujours un objet (jamais `undefined`) pour éviter l'erreur TS sur findMany/count
  const where: Prisma.FranchiseeWhereInput = q
    ? {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { siren: { contains: q } },
        ],
      }
    : {};

  const [items, total] = await Promise.all([
    prisma.franchisee.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: "desc" },
    }),
    prisma.franchisee.count({ where }),
  ]);

  res.json({ items, page, pageSize, total });
});

// GET /franchisees/:id
export const getById: RequestHandler = asyncWrap(async (req, res) => {
  const { id } = franchiseeIdParam.parse(req.params);
  const item = await prisma.franchisee.findUnique({ where: { id } });
  if (!item) throw new HttpError(404, "Franchisee not found");
  res.json(item);
});

// POST /franchisees
export const create: RequestHandler = asyncWrap(async (req, res) => {
  const data = createFranchiseeSchema.parse(req.body);

  // Unicité SIREN (suppose une contrainte unique sur siren)
  const exists = await prisma.franchisee.findUnique({ where: { siren: data.siren } });
  if (exists) throw new HttpError(409, "Franchisee already exists");

  // Champs nullable → forcer à null (jamais undefined)
  const payload: Prisma.FranchiseeCreateInput = {
    name: data.name,
    siren: data.siren,
    // optionnels non-nullables (ex. boolean) : seulement si fournis
    ...(data.active !== undefined ? { active: data.active } : {}),
    contactEmail: data.contactEmail ?? null,
    contactPhone: data.contactPhone ?? null,
    billingAddress: data.billingAddress ?? null,
    joinDate: data.joinDate ?? null,
    ...(data.defaultWarehouseId
      ? { defaultWarehouse: { connect: { id: data.defaultWarehouseId } } }
      : {}),
  };

  const created = await prisma.franchisee.create({ data: payload });
  res.status(201).json(created);
});

// PATCH /franchisees/:id
export const update: RequestHandler = asyncWrap(async (req, res) => {
  const { id } = franchiseeIdParam.parse(req.params);
  const data = updateFranchiseeSchema.parse(req.body);

  // Relation defaultWarehouse (connect / disconnect)
  const relationPart: Prisma.FranchiseeUpdateInput =
    data.defaultWarehouseId !== undefined
      ? data.defaultWarehouseId
        ? { defaultWarehouse: { connect: { id: data.defaultWarehouseId } } }
        : { defaultWarehouse: { disconnect: true } }
      : {};

  // Scalars non-nullables : uniquement s'ils sont fournis
  const nonNullablePart: Prisma.FranchiseeUpdateInput = {
    ...(data.name !== undefined ? { name: { set: data.name } } : {}),
    ...(data.siren !== undefined ? { siren: { set: data.siren } } : {}),
    ...(data.active !== undefined ? { active: { set: data.active } } : {}),
  };

  // Scalars nullable : set avec valeur ou null (jamais undefined)
  const nullablePart: Prisma.FranchiseeUpdateInput = {
    ...(data.contactEmail !== undefined
      ? { contactEmail: { set: data.contactEmail ?? null } }
      : {}),
    ...(data.contactPhone !== undefined
      ? { contactPhone: { set: data.contactPhone ?? null } }
      : {}),
    ...(data.billingAddress !== undefined
      ? { billingAddress: { set: data.billingAddress ?? null } }
      : {}),
    ...(data.joinDate !== undefined ? { joinDate: { set: data.joinDate ?? null } } : {}),
  };

  const payload: Prisma.FranchiseeUpdateInput = {
    ...relationPart,
    ...nonNullablePart,
    ...nullablePart,
  };

  if (Object.keys(payload).length === 0) {
    throw new HttpError(400, "No fields to update");
  }

  const updated = await prisma.franchisee.update({
    where: { id },
    data: payload,
  });

  res.json(updated);
});

// DELETE /franchisees/:id
export const remove: RequestHandler = asyncWrap(async (req, res) => {
  const { id } = franchiseeIdParam.parse(req.params);
  await prisma.franchisee.delete({ where: { id } });
  res.status(204).end();
});
