import { describe, it, expect } from "vitest";
import request from "supertest";
import { app, prisma } from "./setup";
import { getAccessToken, authHeader } from "./helpers/auth";

describe("LoyaltyTransaction", () => {
  it("list + earnOrSpend + get + revert", async () => {
    const token = await getAccessToken();

    const u = await prisma.user.create({ data: { email: `lt${Date.now()}@ex.com`, passwordHash: "hashhashhash", role: "CUSTOMER" } });
    const c = await prisma.customer.create({ data: { userId: u.id } });
    const card = await prisma.loyaltyCard.create({ data: { customerId: c.id, cardNumber: `CARD-${Date.now()}`, points: 0, tier: "BASIC" } });

    const list0 = await request(app).get("/loyalty-transactions").set(authHeader(token));
    expect(list0.status).toBe(200);

    const earn = await request(app).post("/loyalty-transactions").set(authHeader(token)).send({ loyaltyCardId: card.id, type: "EARN", points: 5 });
    expect(earn.status).toBe(201);
    const id = earn.body.id;

    const got = await request(app).get(`/loyalty-transactions/${id}`).set(authHeader(token));
    expect(got.status).toBe(200);

    const del = await request(app).delete(`/loyalty-transactions/${id}`).set(authHeader(token));
    expect([200,204]).toContain(del.status);
  });
});
