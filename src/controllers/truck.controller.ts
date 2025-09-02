import type { RequestHandler } from "express";
import { PrismaClient, Prisma } from "@prisma/client";
import { asyncWrap, HttpError } from "../utils/handlers.js";
import {
  createTruckSchema,
  updateTruckSchema,
  listTruckQuerySchema,
  truckIdParam,
} from "../validators/truck.validators.js";

const prisma = new PrismaClient();

/* ------------ helpers ------------- */
function ensureExactlyOneRelation(franchiseeId?: string | null, warehouseId?: string | null) {
  const hasF = typeof franchiseeId === "string" && franchiseeId.length > 0;
  const hasW = typeof warehouseId === "string" && warehouseId.length > 0;
  if (hasF && hasW) throw new HttpError(400, "Choisir soit un franchisé, soit un entrepôt (pas les deux).");
  if (!hasF && !hasW) throw new HttpError(400, "Choisir au moins un rattachement (franchisé ou entrepôt).");
}

function mapPrismaError(e: any): never {
  if (e?.code === "P2002") {
    // unique constraint
    const fields = Array.isArray(e?.meta?.target) ? e.meta.target.join(", ") : e?.meta?.target ?? "unique field";
    throw new HttpError(409, `Conflit: ${fields} déjà utilisé.`);
  }
  if (e?.code === "P2003") {
    // foreign key
    throw new HttpError(400, "Référence invalide (franchisé/entrepôt inconnu).");
  }
  if (e?.code === "P2025") {
    // not found
    throw new HttpError(404, "Ressource introuvable.");
  }
  throw e;
}

/* ------------ LIST ------------ */
export const list: RequestHandler = asyncWrap(async (req, res) => {
  const { page = 1, pageSize = 20, franchiseeId, status } = listTruckQuerySchema.parse(req.query);

  const where: Prisma.TruckWhereInput = {
    ...(franchiseeId ? { franchiseeId } : {}),
    ...(status ? { currentStatus: status } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.truck.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: "desc" },
    }),
    prisma.truck.count({ where }),
  ]);

  res.json({ items, page, pageSize, total });
});

/* ------------ GET BY ID ------------ */
export const getById: RequestHandler = asyncWrap(async (req, res) => {
  const { id } = truckIdParam.parse(req.params);
  const item = await prisma.truck.findUnique({ where: { id } });
  if (!item) throw new HttpError(404, "Truck not found");
  res.json(item);
});

/* ------------ CREATE ------------ */
export const create: RequestHandler = asyncWrap(async (req, res) => {
  const data = createTruckSchema.parse(req.body);
  const { franchiseeId, warehouseId } = data as {
    franchiseeId?: string | null;
    warehouseId?: string | null;
  };

  // Règle métier: exactement une des deux relations
  ensureExactlyOneRelation(franchiseeId, warehouseId);

  const payload: Prisma.TruckCreateInput = {
    vin: data.vin,
    plateNumber: data.plateNumber,

    ...(data.active !== undefined ? { active: data.active } : {}),
    ...(data.currentStatus !== undefined
      ? { currentStatus: data.currentStatus }
      : {
          // fallback logique si le front n'envoie pas le statut
          currentStatus: (typeof franchiseeId === "string" && franchiseeId) ? "DEPLOYED" : "AVAILABLE",
        }),

    ...(data.model !== undefined ? { model: data.model ?? null } : {}),
    ...(data.purchaseDate !== undefined ? { purchaseDate: data.purchaseDate ?? null } : {}),

    ...(typeof franchiseeId === "string" && franchiseeId
      ? { franchisee: { connect: { id: franchiseeId } } }
      : {}),
    ...(typeof warehouseId === "string" && warehouseId
      ? { warehouse: { connect: { id: warehouseId } } }
      : {}),
  };

  try {
    const created = await prisma.truck.create({ data: payload });
    res.status(201).json(created);
  } catch (e: any) {
    mapPrismaError(e);
  }
});

/* ------------ UPDATE ------------ */
export const update: RequestHandler = asyncWrap(async (req, res) => {
  const { id } = truckIdParam.parse(req.params);
  const data = updateTruckSchema.parse(req.body);

  // Si l'appelant tente de changer les deux en même temps, on vérifie que ça ne viole pas la règle
  if (data.franchiseeId !== undefined || data.warehouseId !== undefined) {
    const f = (data.franchiseeId ?? undefined) as string | null | undefined;
    const w = (data.warehouseId ?? undefined) as string | null | undefined;

    // Cas interdits : connect F et connect W dans la même requête ; disconnect F et disconnect W dans la même requête
    if (typeof f === "string" && typeof w === "string") {
      throw new HttpError(400, "Impossible de lier un franchisé et un entrepôt simultanément.");
    }
    if (f === null && w === null) {
      throw new HttpError(400, "Impossible de détacher franchisé et entrepôt simultanément.");
    }
  }

  const relationPart: Prisma.TruckUpdateInput = {
    ...(data.franchiseeId === null
      ? { franchisee: { disconnect: true } }
      : typeof data.franchiseeId === "string"
      ? { franchisee: { connect: { id: data.franchiseeId } } }
      : {}),

    ...(data.warehouseId === null
      ? { warehouse: { disconnect: true } }
      : typeof data.warehouseId === "string"
      ? { warehouse: { connect: { id: data.warehouseId } } }
      : {}),
  };

  const scalarNonNull: Prisma.TruckUpdateInput = {
    ...(data.vin !== undefined ? { vin: { set: data.vin } } : {}),
    ...(data.plateNumber !== undefined ? { plateNumber: { set: data.plateNumber } } : {}),
    ...(data.active !== undefined ? { active: { set: data.active } } : {}),
    ...(data.currentStatus !== undefined ? { currentStatus: { set: data.currentStatus } } : {}),
  };

  const scalarNullable: Prisma.TruckUpdateInput = {
    ...(data.model !== undefined ? { model: { set: data.model ?? null } } : {}),
    ...(data.purchaseDate !== undefined ? { purchaseDate: { set: data.purchaseDate ?? null } } : {}),
  };

  const payload: Prisma.TruckUpdateInput = {
    ...relationPart,
    ...scalarNonNull,
    ...scalarNullable,
  };

  try {
    const updated = await prisma.truck.update({ where: { id }, data: payload });
    res.json(updated);
  } catch (e: any) {
    mapPrismaError(e);
  }
});

/* ------------ DELETE ------------ */
export const remove: RequestHandler = asyncWrap(async (req, res) => {
  const { id } = truckIdParam.parse(req.params);
  try {
    await prisma.truck.delete({ where: { id } });
    res.status(204).end();
  } catch (e: any) {
    mapPrismaError(e);
  }
});
