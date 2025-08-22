import type { RequestHandler } from "express";
import { PrismaClient } from "@prisma/client";
import { asyncWrap } from "../utils/handlers.js";
import { listAuditLogQuerySchema, auditLogIdParam } from "../validators/audit-log.validators.js";

const prisma = new PrismaClient();

export const list: RequestHandler = asyncWrap(async (req, res) => {
  const { page = 1, pageSize = 20, actorUserId, entity, entityId } = listAuditLogQuerySchema.parse(req.query);
  const where: any = {};
  if (actorUserId) where.actorUserId = actorUserId;
  if (entity) where.entity = entity;
  if (entityId) where.entityId = entityId;

  const [items, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: "desc" },
    }),
    prisma.auditLog.count({ where }),
  ]);

  res.json({ items, page, pageSize, total });
});

export const getById: RequestHandler<{ id: string }> = async (req, res) => {
  const id = req.params.id as string;
  const row = await prisma.auditLog.findUnique({ where: { id } });
  if (!row) return res.status(404).json({ message: "Not found" });
  res.json(row);
};