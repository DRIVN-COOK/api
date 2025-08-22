import { describe, it, expect } from "vitest";
import request from "supertest";
import { app, prisma } from "./setup";
import { getAccessToken, authHeader } from "./helpers/auth";
import { uniqueSiren } from "./helpers/data";

describe("RevenueShareReport", () => {
  it("list + generate + get + pdf", async () => {
    const token = await getAccessToken();
    const f = await prisma.franchisee.create({ data: { name: `Fr-${Date.now()}`, siren: uniqueSiren() } });

    const list0 = await request(app).get("/revenue-share-reports").set(authHeader(token));
    expect(list0.status).toBe(200);

    const gen = await request(app).post("/revenue-share-reports").set(authHeader(token)).send({ franchiseeId: f.id, period: "2025-07" });
    expect(gen.status).toBe(201);
    const id = gen.body.id;

    const got = await request(app).get(`/revenue-share-reports/${id}`).set(authHeader(token));
    expect(got.status).toBe(200);

    const pdf = await request(app).get(`/revenue-share-reports/${id}/pdf`).set(authHeader(token));
    expect(pdf.status).toBe(200);
  });
});
