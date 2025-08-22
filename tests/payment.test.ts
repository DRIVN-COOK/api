import { crudTestSuite } from "./helpers/crudSuite";
import request from "supertest";
import { prisma, app } from "./setup";
import { getAccessToken, authHeader } from "./helpers/auth";
import { expect } from "vitest";
import { uniqueSiren } from "./helpers/data";


crudTestSuite("Payment", {
  basePath: "/payments",
  makeCreate: async () => {
    const u = await prisma.user.create({ data: { email: `pay${Date.now()}@ex.com`, passwordHash: "hashhashhash", role: "CUSTOMER" } });
    const c = await prisma.customer.create({ data: { userId: u.id } });
    const f = await prisma.franchisee.create({ data: { name: `Fr-${Date.now()}`, siren: uniqueSiren() } });
    const co = await prisma.customerOrder.create({ data: { customerId: c.id, franchiseeId: f.id, totalHT: 10, totalTVA: 1, totalTTC: 11 } });
    return { customerOrderId: co.id, provider: "CARD", amount: 11 };
  },
  makeUpdate: () => ({ status: "PAID" }),
  extras: [
    async (id) => {
      const token = await getAccessToken();
      const cap = await request(app).post(`/payments/${id}/capture`).set(authHeader(token)).send({});
      expect([200, 409, 404]).toContain(cap.status);
      const ref = await request(app).post(`/payments/${id}/refund`).set(authHeader(token)).send({});
      expect([200, 409, 404]).toContain(ref.status);
    },
  ],
});
