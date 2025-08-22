// utils/prisma.ts
export function pickDefined<T extends Record<string, any>>(obj: T): Partial<T> {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as Partial<T>;
}

// Quand un champ est nullable en DB (string? / DateTime?), Prisma attend "null" si tu l'inclus.
// Ce helper convertit undefined -> null pour des clés ciblées.
export function toNullIfUndef<T extends Record<string, any>, K extends keyof T>(obj: T, keys: readonly K[]) {
  const clone: any = { ...obj };
  for (const k of keys) if (clone[k] === undefined) clone[k] = null;
  return clone as T;
}

// Ajoute "where" uniquement s’il existe (évite "where: undefined")
export function withWhere<T extends object>(args: T, where: undefined): T;
export function withWhere<T extends object, W extends object>(
  args: T,
  where: W
): T & { where: W };
export function withWhere(args: any, where: any) {
  return where ? { ...args, where } : args;
}
