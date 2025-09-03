import type { RequestHandler } from "express";
import { PrismaClient, Prisma } from "@prisma/client";
import { asyncWrap, HttpError } from "../utils/handlers.js";
import {
  createFranchiseeSchema,
  updateFranchiseeSchema,
  listFranchiseeQuerySchema,
  franchiseeIdParam,
} from "../validators/franchisee.validators.js";
import { FIXED_ENTRY_FEE, FIXED_REVENUE_PCT } from '../controllers/franchise-agreement.controller.js';

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
  if (exists) throw new HttpError(409, 'Franchisee already exists');

  // Champs nullable → forcer à null (jamais undefined)
  const payload: Prisma.FranchiseeCreateInput = {
    name: data.name,
    siren: data.siren,
    ...(data.active !== undefined ? { active: data.active } : {}),
    contactEmail: data.contactEmail ?? null,
    contactPhone: data.contactPhone ?? null,
    billingAddress: data.billingAddress ?? null,
    joinDate: data.joinDate ?? null,
    ...(data.defaultWarehouseId
      ? { defaultWarehouse: { connect: { id: data.defaultWarehouseId } } }
      : {}),
  };

  // Date de début d’accord: joinDate si fourni, sinon "aujourd’hui"
  const agreementStart = data.joinDate ? new Date(data.joinDate) : new Date();

  const result = await prisma.$transaction(async (tx) => {
    // 1) créer la franchise
    const created = await tx.franchisee.create({
      data: payload,
    });

    // 2) créer l’accord lié avec les valeurs verrouillées
    await tx.franchiseAgreement.create({
      data: {
        franchisee: { connect: { id: created.id } },
        startDate: agreementStart,
        endDate: null,
        entryFeeAmount: FIXED_ENTRY_FEE,
        revenueSharePct: FIXED_REVENUE_PCT,
        notes: null,
      },
    });

    // 3) renvoyer la franchise enrichie (avec agreements si tu veux l’afficher direct)
    return tx.franchisee.findUniqueOrThrow({
      where: { id: created.id },
      include: {
        defaultWarehouse: true,
        agreements: true, // <- utile pour vérifier côté back-office
      },
    });
  });

  res.status(201).json(result);
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
