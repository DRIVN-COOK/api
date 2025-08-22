import { describe, it, expect } from "vitest";
import request from "supertest";
import { app, prisma } from "./setup";
import { getAccessToken, authHeader } from "./helpers/auth";
import { uniqueSiren } from "./helpers/data";

describe("Invoice", () => {
  it("list + issue + get + pdf", async () => {
    const token = await getAccessToken();

    const u = await prisma.user.create({ data: { email: `inv${Date.now()}@ex.com`, passwordHash: "hashhashhash", role: "CUSTOMER" } });
    const c = await prisma.customer.create({ data: { userId: u.id } });
    const f = await prisma.franchisee.create({ data: { name: `Fr-${Date.now()}`, siren: uniqueSiren() } });
    const co = await prisma.customerOrder.create({ data: { customerId: c.id, franchiseeId: f.id, totalHT: 10, totalTVA: 1, totalTTC: 11 } });

    const list0 = await request(app).get("/invoices").set(authHeader(token));
    expect(list0.status).toBe(200);

    const issue = await request(app).post("/invoices").set(authHeader(token)).send({ customerOrderId: co.id, invoiceNumber: `INV-${Date.now()}` });
    expect(issue.status).toBe(201);
    const id = issue.body.id;

    const got = await request(app).get(`/invoices/${id}`).set(authHeader(token));
    expect(got.status).toBe(200);

    const pdf = await request(app).get(`/invoices/${id}/pdf`).set(authHeader(token));
    expect(pdf.status).toBe(200);
  });
});
