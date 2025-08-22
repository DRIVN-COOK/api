import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "./setup";
import { getAccessToken, authHeader } from "./helpers/auth";

describe("AuditLog", () => {
  it("list (200)", async () => {
    const token = await getAccessToken();
    const list0 = await request(app).get("/audit-logs").set(authHeader(token));
    expect(list0.status).toBe(200);
  });

  it("getById (404/200)", async () => {
    const token = await getAccessToken();
    const res = await request(app).get("/audit-logs/00000000-0000-0000-0000-000000000000").set(authHeader(token));
    expect([400,404]).toContain(res.status);
  });
});
