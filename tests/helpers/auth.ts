import request from "supertest";
import { app } from "../setup";                       // <-- garde ton import actuel
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import { signAccessToken } from "../../src/utils/jwt"; // <-- ajuste le chemin si besoin

dotenv.config({ path: '../infra/.env' });

const prisma = new PrismaClient();

// On reste dans le contrat de src/utils/jwt : 'USER' | 'ADMIN'
const ADMIN_EMAIL = "admin@test.local";
const ADMIN_PASSWORD = "Admin123!";
const ADMIN_ROLE = "ADMIN" as const; // 👈 IMPORTANT

async function ensureAdminUser() {
  const rounds = Number(process.env.BCRYPT_ROUNDS ?? 10);
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, rounds);

  await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {
      passwordHash,
      role: ADMIN_ROLE, // 👈 aligne avec utils/jwt
    },
    create: {
      email: ADMIN_EMAIL,
      passwordHash,
      role: ADMIN_ROLE,
      // firstName/lastName si ton schéma les impose
    },
  });

  // on évite des RT résiduels
  await prisma.refreshToken
    .deleteMany({ where: { user: { email: ADMIN_EMAIL } } })
    .catch(() => {});
}

export async function getAccessToken() {
  await ensureAdminUser();

  // 1) tenter le login “réel”
  const res = await request(app)
    .post("/auth/login")
    .set("User-Agent", "tests")
    .send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD });

  if (res.status === 200 && res.body?.accessToken) {
    return res.body.accessToken as string;
  }

  // 2) fallback: forger un access token via ton util
  const user = await prisma.user.findUniqueOrThrow({ where: { email: ADMIN_EMAIL } });
  // payload: { sub, role, type: 'access' } + expiresIn de ton util
  const token = signAccessToken(user.id, ADMIN_ROLE);
  return token;
}

export const authHeader = (t: string) => ({ Authorization: `Bearer ${t}` });
