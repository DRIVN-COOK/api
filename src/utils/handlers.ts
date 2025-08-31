import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

export function asyncWrap<T extends (req: Request, res: Response, next: NextFunction) => any>(fn: T) {
  return (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(fn(req, res, next)).catch(next);
}

export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

// middleware d’erreur global (à mettre dans server.ts)
export function errorMiddleware(err: any, _req: Request, res: Response, _next: NextFunction) {
  // Zod → 400 + détails exploitables par le front
  if (err instanceof ZodError) {
    return res.status(400).json({
      name: "ZodError",
      issues: err.issues, // [{ path, message, ... }]
    });
  }

  // Erreurs “connues” avec message
  if (err && typeof err === "object" && "status" in err && "message" in err) {
    const status = (err as any).status || 500;
    return res.status(status).json({
      message: (err as any).message || "Server error",
    });
  }

  // Fallback 500 (éviter d’exposer la stack en prod)
  console.error(err);
  return res.status(500).json({ message: "Internal server error" });
}
