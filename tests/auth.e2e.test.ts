import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Auth flow', () => {
  beforeAll(async () => {
    await prisma.refreshToken.deleteMany({});
    await prisma.user.deleteMany({});
  });

  it('register + login + me + refresh + logout', async () => {
    const email = 'test@example.com';
    const password = 'Password123!';

    const reg = await request(app).post('/auth/register').send({ email, password, firstName: 'A' });
    expect(reg.status).toBe(201);
    expect(reg.body.accessToken).toBeDefined();
    expect(reg.body.refreshToken).toBeDefined();

    const login = await request(app).post('/auth/login').send({ email, password });
    expect(login.status).toBe(200);
    const { accessToken, refreshToken } = login.body;

    const me = await request(app).get('/auth/me').set('Authorization', `Bearer ${accessToken}`);
    expect(me.status).toBe(200);
    expect(me.body.email).toBe(email);

    const ref = await request(app).post('/auth/refresh').send({ refreshToken });
    expect(ref.status).toBe(200);
    expect(ref.body.accessToken).toBeDefined();
    expect(ref.body.refreshToken).toBeDefined();

    const lo = await request(app).post('/auth/logout').send({ refreshToken });
    expect(lo.status).toBe(204);
  });
});
