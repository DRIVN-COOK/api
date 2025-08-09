import type { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';

type JwtPayload = { sub: string; role: 'USER' | 'ADMIN' };

export const requireAuth: RequestHandler = (req, res, next) => {
  const hdr = req.headers.authorization;
  if (!hdr?.startsWith('Bearer ')) return res.status(401).json({ message: 'Missing token' });
  const token = hdr.slice('Bearer '.length);
  try {
    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as JwtPayload;
    (req as any).user = { id: payload.sub, role: payload.role };
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid/expired token' });
  }
};

export const requireAdmin: RequestHandler = (req, res, next) => {
  if (!(req as any).user) return res.status(401).json({ message: 'Unauthorized' });
  if ((req as any).user.role !== 'ADMIN') return res.status(403).json({ message: 'Forbidden' });
  next();
};
