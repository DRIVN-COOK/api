import jwt from 'jsonwebtoken';
import type { JwtPayload, SignOptions, Secret } from 'jsonwebtoken';
import dotenv from "dotenv";
dotenv.config({ path: '../infra/.env' });

const accessSecret: Secret = process.env.JWT_ACCESS_SECRET!;
const refreshSecret: Secret = process.env.JWT_REFRESH_SECRET!;

type Expires = NonNullable<SignOptions['expiresIn']>;

function getExpires(envVal: string | undefined, fallback: Expires): Expires {
  return (envVal ?? fallback) as Expires;
}

export function signAccessToken(sub: string, role: 'USER' | 'ADMIN') {
  const payload: JwtPayload = { sub, role };
  const options: SignOptions = { expiresIn: getExpires(process.env.JWT_ACCESS_EXPIRES, '5m') };
  return jwt.sign(payload, accessSecret, options);
}

export function signRefreshToken(sub: string, role: 'USER' | 'ADMIN') {
  const payload: JwtPayload = { sub, role };
  const options: SignOptions = { expiresIn: getExpires(process.env.JWT_REFRESH_EXPIRES, '7d') };
  return jwt.sign(payload, refreshSecret, options);
}

export function verifyAccess(token: string) {
  return jwt.verify(token, accessSecret) as JwtPayload;
}
