import type { NextFunction, Request, Response } from "express";

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
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message });
  }
  console.error(err);
  res.status(500).json({ error: "Internal Server Error" });
}
