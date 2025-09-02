import { z } from "zod";
import { idParamSchema } from "./common.js";
import { Role } from '@prisma/client';

export const createUserSchema = z.object({
  email: z.string().email(),
  passwordHash: z.string().min(10),
  firstName: z.string().max(120).optional(),
  lastName: z.string().max(120).optional(),
  role: z.enum(["USER","ADMIN","HQ_STAFF","FRANCHISEE","CUSTOMER"]).default("USER"),
});

export const updateUserSchema = createUserSchema.partial();
export const listUserQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  q: z.union([z.string(), z.array(z.string())]).optional(),
  search: z.union([z.string(), z.array(z.string())]).optional(),
  role: z.nativeEnum(Role).optional(),
}).transform(({ q, search, role, ...rest }) => {
  const pick = (v?: string | string[]) => (Array.isArray(v) ? v[0] : v);
  const s = (pick(q) ?? pick(search))?.trim();
  return { ...rest, q: s && s.length ? s : undefined, role };
});
export const userIdParam = idParamSchema;
