import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { add } from 'date-fns';
import { signAccessToken, signRefreshToken } from '../utils/jwt.js';

const prisma = new PrismaClient();

type RegisterInput = {
  email: string;
  password: string;
  firstName?: string | null;
  lastName?: string | null;
};

type LoginInput = {
  email: string;
  password: string;
  ip?: string | null;
  userAgent?: string | null;
};

export async function registerUser(input: RegisterInput) {
  const exists = await prisma.user.findUnique({ where: { email: input.email } });
  if (exists) throw new Error('EMAIL_TAKEN');

  const passwordHash = await bcrypt.hash(input.password, 12);
  
  const user = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash,
      firstName: input.firstName ?? null,
      lastName: input.lastName ?? null,
    },
  });

  const accessToken = signAccessToken(user.id, user.role);
  const refreshToken = signRefreshToken(user.id, user.role);

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: add(new Date(), { days: 7 }),
    },
  });

  return { user: sanitizeUser(user), accessToken, refreshToken };
}

export async function loginUser(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) throw new Error('INVALID_CREDENTIALS');

  const ok = await bcrypt.compare(input.password, user.passwordHash);
  if (!ok) throw new Error('INVALID_CREDENTIALS');

  const accessToken = signAccessToken(user.id, user.role);
  const refreshToken = signRefreshToken(user.id, user.role);

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      ip: input.ip ?? null,
      userAgent: input.userAgent ?? null,
      expiresAt: add(new Date(), { days: 7 }),
    },
  });

  return { user: sanitizeUser(user), accessToken, refreshToken };
}

export async function me(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('NOT_FOUND');
  return sanitizeUser(user);
}

export async function refreshTokens(refreshToken: string) {
  const stored = await prisma.refreshToken.findUnique({
    where: { token: refreshToken },
    include: { user: true },
  });
  if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
    throw new Error('INVALID_REFRESH');
  }

  // rotation
  await prisma.refreshToken.update({
    where: { token: refreshToken },
    data: { revokedAt: new Date() },
  });

  const user = stored.user;
  const newAccess = signAccessToken(user.id, user.role);
  const newRefresh = signRefreshToken(user.id, user.role);

  await prisma.refreshToken.create({
    data: {
      token: newRefresh,
      userId: user.id,
      expiresAt: add(new Date(), { days: 7 }),
    },
  });

  return { accessToken: newAccess, refreshToken: newRefresh };
}

export async function logout(refreshToken: string) {
  await prisma.refreshToken.updateMany({
    where: { token: refreshToken, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

function sanitizeUser<T extends { passwordHash?: string }>(u: T) {
  const { passwordHash, ...rest } = u as any;
  return rest;
}
