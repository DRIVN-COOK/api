import type { RequestHandler, Request } from "express";
import { PrismaClient, Prisma } from "@prisma/client";
import { asyncWrap, HttpError } from "../utils/handlers.js";
import {
  attachFranchiseUserSchema,
  updateFranchiseUserSchema,
  listFranchiseUserQuerySchema,
  franchiseUserIdParam,
} from "../validators/franchise-user.validators.js";

const prisma = new PrismaClient();

/** --- AJOUT: petit alias pour typer req.auth/req.user si présents --- */
type ReqAuth = Request & {
  auth?: { userId: string; role?: string; email?: string };
  user?: { id: string };
};

/**
 * GET /franchise-users
 */
export const list: RequestHandler = asyncWrap(async (req, res) => {
  const { page = 1, pageSize = 20, userId, franchiseeId } =
    listFranchiseUserQuerySchema.parse(req.query);

  const where: Prisma.FranchiseUserWhereInput = {
    ...(userId ? { userId } : {}),
    ...(franchiseeId ? { franchiseeId } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.franchiseUser.findMany({
      where,
      include: { user: true, franchisee: true },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { id: "desc" },
    }),
    prisma.franchiseUser.count({ where }),
  ]);

  res.json({ items, page, pageSize, total });
});

/**
 * POST /franchise-users/attach-self
 * Attache l'utilisateur authentifié à une franchise (OWNER par défaut)
 */
export const attachSelf: RequestHandler = asyncWrap(async (req, res) => {
  /** --- AJOUT: récupération sûre de l'id depuis req.auth ou req.user --- */
  const authUserId =
    (req as ReqAuth).auth?.userId ?? (req as ReqAuth).user?.id ?? null;

  if (!authUserId) throw new HttpError(401, "Unauthorized");

  const body = attachFranchiseUserSchema.omit({ userId: true }).parse(req.body);

  try {
    const created = await prisma.franchiseUser.create({
      data: {
        user: { connect: { id: authUserId } },
        franchisee: { connect: { id: body.franchiseeId } },
        ...(body.roleInFranchise
          ? { roleInFranchise: body.roleInFranchise }
          : {}),
      },
      include: { user: true, franchisee: true },
    });
    res.status(201).json(created);
  } catch (e: any) {
    // Contrainte d'unicité (userId, franchiseeId)
    if (e?.code === "P2002") {
      res.status(409).json({ message: "User already attached to this franchisee" });
      return;
    }
    throw e;
  }
});

/**
 * GET /franchise-users/:id
 */
export const getById: RequestHandler = asyncWrap(async (req, res) => {
  const { id } = franchiseUserIdParam.parse(req.params);
  const item = await prisma.franchiseUser.findUnique({
    where: { id },
    include: { user: true, franchisee: true },
  });
  if (!item) throw new HttpError(404, "FranchiseUser not found");
  res.json(item);
});

/**
 * POST /franchise-users
 * Attache un user arbitraire à une franchise (utilisation admin)
 */
export const attachUser: RequestHandler = asyncWrap(async (req, res) => {
  const data = attachFranchiseUserSchema.parse(req.body);

  const payload: Prisma.FranchiseUserCreateInput = {
    user: { connect: { id: data.userId } },
    franchisee: { connect: { id: data.franchiseeId } },
    ...(data.roleInFranchise !== undefined
      ? { roleInFranchise: data.roleInFranchise ?? null }
      : {}),
  };

  try {
    const created = await prisma.franchiseUser.create({
      data: payload,
      include: { user: true, franchisee: true },
    });
    res.status(201).json(created);
  } catch (e: any) {
    if (e?.code === "P2002") {
      res.status(409).json({ message: "User already attached to this franchisee" });
      return;
    }
    throw e;
  }
});

/**
 * PUT /franchise-users/:id
 */
export const update: RequestHandler = asyncWrap(async (req, res) => {
  const { id } = franchiseUserIdParam.parse(req.params);
  const data = updateFranchiseUserSchema.parse(req.body);

  const relationPart: Prisma.FranchiseUserUpdateInput = {
    ...(data.userId !== undefined ? { user: { connect: { id: data.userId } } } : {}),
    ...(data.franchiseeId !== undefined
      ? { franchisee: { connect: { id: data.franchiseeId } } }
      : {}),
  };

  const scalarPart: Prisma.FranchiseUserUpdateInput = {
    ...(data.roleInFranchise !== undefined
      ? { roleInFranchise: { set: data.roleInFranchise ?? null } }
      : {}),
  };

  const payload: Prisma.FranchiseUserUpdateInput = {
    ...relationPart,
    ...scalarPart,
  };

  if (Object.keys(payload).length === 0) {
    throw new HttpError(400, "No fields to update");
  }

  const updated = await prisma.franchiseUser.update({
    where: { id },
    data: payload,
    include: { user: true, franchisee: true },
  });

  res.json(updated);
});

/**
 * DELETE /franchise-users/:id
 */
export const detachUser: RequestHandler = asyncWrap(async (req, res) => {
  const { id } = franchiseUserIdParam.parse(req.params);
  await prisma.franchiseUser.delete({ where: { id } });
  res.status(204).end();
});
