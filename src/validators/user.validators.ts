import { z } from "zod";
import { idParamSchema, paginationQuerySchema } from "./common.js";

export const createUserSchema = z.object({
  email: z.string().email(),
  passwordHash: z.string().min(10),
  firstName: z.string().max(120).optional(),
  lastName: z.string().max(120).optional(),
  role: z.enum(["USER","ADMIN","HQ_STAFF","FRANCHISE_OWNER","TRUCK_STAFF","CUSTOMER"]).default("USER"),
});

export const updateUserSchema = createUserSchema.partial();
export const listUserQuerySchema = paginationQuerySchema;
export const userIdParam = idParamSchema;
