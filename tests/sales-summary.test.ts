import { describe, it, expect } from "vitest";
import request from "supertest";
import { app, prisma } from "./setup";
import { getAccessToken, authHeader } from "./helpers/auth";
import { uniqueSiren } from "./helpers/data";

describe("SalesSummary", () => {
  it("list + rebuildPeriod", async () => {
    const token = await getAccessToken();
    const f = await prisma.franchisee.create({ data: { name: `Fr-${Date.now()}`, siren: uniqueSiren()} });

    const list0 = await request(app).get("/sales-summaries").set(authHeader(token));
    expect(list0.status).toBe(200);

    const rebuild = await request(app).post("/sales-summaries/rebuild").set(authHeader(token)).send({ franchiseeId: f.id, period: "2025-07" });
    expect(rebuild.status).toBe(200);
  });
});
