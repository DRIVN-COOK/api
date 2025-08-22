import { describe, it, expect } from "vitest";
import request from "supertest";
import { app, prisma } from "./setup";
import { getAccessToken, authHeader } from "./helpers/auth";
import { uniqueSiren } from "./helpers/data";

describe("EventRegistration", () => {
  it("list + register + get + cancel", async () => {
    const token = await getAccessToken();

    const u = await prisma.user.create({ data: { email: `er${Date.now()}@ex.com`, passwordHash: "hashhashhash", role: "CUSTOMER" } });
    const c = await prisma.customer.create({ data: { userId: u.id } });
    const f = await prisma.franchisee.create({ data: { name: `Fr-${Date.now()}`, siren: uniqueSiren() } });
    const e = await prisma.event.create({ data: { franchiseeId: f.id, title: "Fête", startAt: new Date(), isPublic: true } });

    const list0 = await request(app).get("/event-registrations").set(authHeader(token));
    expect(list0.status).toBe(200);

    const reg = await request(app).post("/event-registrations").send({ eventId: e.id, customerId: c.id, status: "REGISTERED" });
    expect(reg.status).toBe(201);
    const id = reg.body.id;

    const got = await request(app).get(`/event-registrations/${id}`).set(authHeader(token));
    expect(got.status).toBe(200);

    const cancel = await request(app).delete(`/event-registrations/${id}`).set(authHeader(token));
    expect([200,204]).toContain(cancel.status);
  });
});
