import jwt from "jsonwebtoken";
import type { JwtPayload, SignOptions, Secret } from "jsonwebtoken";
import { Role } from "@prisma/client";
import dotenv from "dotenv";
import crypto from "crypto";

dotenv.config({ path: "../infra/.env" });

const accessSecret: Secret  = process.env.JWT_ACCESS_SECRET!;
const refreshSecret: Secret = process.env.JWT_REFRESH_SECRET!;

type Expires = NonNullable<SignOptions["expiresIn"]>;

function getExpires(envVal: string | undefined, fallback: Expires): Expires {
  return (envVal ?? fallback) as Expires;
}

// payload commun
type TokenKind = "access" | "refresh";
type TokenPayload = JwtPayload & {
  sub: string;
  role: Role;
  type: TokenKind;
};

export function signAccessToken(sub: string, role: Role) {
  const payload: TokenPayload = { sub, role, type: "access" };
  const options: SignOptions = {
    expiresIn: getExpires(process.env.JWT_ACCESS_EXPIRES, "5m"),
  };
  return jwt.sign(payload, accessSecret, options);
}

export function signRefreshToken(sub: string, role: Role) {
  const payload: TokenPayload = { sub, role, type: "refresh" };
  const options: SignOptions = {
    expiresIn: getExpires(process.env.JWT_REFRESH_EXPIRES, "7d"),
    jwtid: crypto.randomUUID(),
  };
  return jwt.sign(payload, refreshSecret, options);
}

export function verifyAccess(token: string) {
  return jwt.verify(token, accessSecret) as TokenPayload;
}

// Optionnel : utile si tu vérifies explicitement le refresh côté service
export function verifyRefresh(token: string) {
  return jwt.verify(token, refreshSecret) as TokenPayload;
}
