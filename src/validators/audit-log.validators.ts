import { z } from "zod";
import { idParamSchema, paginationQuerySchema } from "./common.js";

export const listAuditLogQuerySchema = paginationQuerySchema.extend({
  actorUserId: z.string().uuid().optional(),
  entity: z.string().max(80).optional(),
  entityId: z.string().max(80).optional(),
});

export const auditLogIdParam = idParamSchema;