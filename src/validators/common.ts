import { z } from "zod";

export const idParamSchema = z.object({
  id: z.string().uuid(),
});

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).default(20).optional(),
  q: z.string().trim().min(1).max(200).optional(),
});

export const nullableId = z.preprocess(
  (v) => (v === '' || v === undefined ? null : v),
  z.string().uuid().nullable()
);

export type IdParam = z.infer<typeof idParamSchema>;
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

