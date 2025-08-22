import { crudTestSuite } from "./helpers/crudSuite";
import request from "supertest";
import { prisma, app } from "./setup";
import { getAccessToken, authHeader } from "./helpers/auth";
import { expect } from "vitest";
import { uniqueSiren } from "./helpers/data";


crudTestSuite("CustomerOrder", {
  basePath: "/customer-orders",
  makeCreate: async () => {
    const u = await prisma.user.create({ data: { email: `cust${Date.now()}@ex.com`, passwordHash: "hashhashhash", role: "CUSTOMER" } });
    const c = await prisma.customer.create({ data: { userId: u.id } });
    const f = await prisma.franchisee.create({ data: { name: `Fr-${Date.now()}`, siren: uniqueSiren()} });
    return { customerId: c.id, franchiseeId: f.id, totalHT: 10, totalTVA: 1, totalTTC: 11, channel: "IN_PERSON" };
  },
  makeUpdate: () => ({ status: "CONFIRMED" }),
  // endpoints custom
  updatePath: (id) => `/customer-orders/${id}/status`,
  extras: [
    async (id) => {
      const token = await getAccessToken();
      const res = await request(app).put(`/customer-orders/${id}/status`).set(authHeader(token)).send({ status: "CONFIRMED" });
      expect([200, 409]).toContain(res.status);
    },
  ],
});
