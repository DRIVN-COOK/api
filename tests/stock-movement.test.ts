import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "./setup";
import { getAccessToken, authHeader } from "./helpers/auth";

describe("StockMovement", () => {
  it("GET list (200)", async () => {
    const token = await getAccessToken();
    const res = await request(app).get("/stock-movements").set(authHeader(token));
    expect(res.status).toBe(200);
  });

  it("GET by id (404/200)", async () => {
    const token = await getAccessToken();
    const res = await request(app).get("/stock-movements/00000000-0000-0000-0000-000000000000").set(authHeader(token));
    expect([400,404]).toContain(res.status);
  });
});
