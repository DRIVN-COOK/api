import type { RequestHandler } from 'express';
import { registerSchema, loginSchema, refreshSchema } from '../validators/auth.validators.js';
import * as auth from '../services/auth.service.js';

export const register: RequestHandler = async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() });

  try {
    const data = await auth.registerUser({
      ...parsed.data,
      firstName: parsed.data.firstName ?? null,
      lastName: parsed.data.lastName ?? null,
    });
    return res.status(201).json(data);
  } catch (e: any) {
    if (e.message === 'EMAIL_TAKEN') return res.status(409).json({ message: 'Email already in use' });
    return res.status(500).json({ message: 'Server error' });
  }
};

export const login: RequestHandler = async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() });

  try {
    const data = await auth.loginUser({
      ...parsed.data,
      ip: req.ip ?? null,
      userAgent: (req.headers['user-agent'] as string | undefined) ?? null,
    });
    return res.json(data);
  } catch (e: any) {
    if (e.message === 'INVALID_CREDENTIALS') return res.status(401).json({ message: 'Invalid credentials' });
    return res.status(500).json({ message: 'Server error' });
  }
};

export const me: RequestHandler = async (req, res) => {
  try {
    const data = await auth.me((req as any).user.id);
    return res.json(data);
  } catch {
    return res.status(404).json({ message: 'User not found' });
  }
};

export const refresh: RequestHandler = async (req, res) => {
  const parsed = refreshSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() });
  try {
    const tokens = await auth.refreshTokens(parsed.data.refreshToken);
    return res.json(tokens);
  } catch {
    return res.status(401).json({ message: 'Invalid refresh token' });
  }
};

export const logout: RequestHandler = async (req, res) => {
  const parsed = refreshSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() });
  await auth.logout(parsed.data.refreshToken);
  return res.status(204).send();
};
