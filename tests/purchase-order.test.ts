import { crudTestSuite } from "./helpers/crudSuite";
import request from "supertest";
import { prisma, app } from "./setup";
import { getAccessToken, authHeader } from "./helpers/auth";
import { expect } from "vitest";
import { uniqueSiren } from "./helpers/data";


crudTestSuite("PurchaseOrder", {
  basePath: "/purchase-orders",
  makeCreate: async () => {
    const f = await prisma.franchisee.create({ data: { name: `Fr-${Date.now()}`, siren: uniqueSiren() } });
    const w = await prisma.warehouse.create({ data: { name: `WH-${Date.now()}` } });
    return { franchiseeId: f.id, warehouseId: w.id };
  },
  makeUpdate: async () => {
    const w2 = await prisma.warehouse.create({ data: { name: `WH-${Date.now()}-2` } });
    return { warehouseId: w2.id };
  },
  extras: [
    async (id) => {
      const token = await getAccessToken();
      const p = await prisma.product.create({ data: { sku: `SKU-${Date.now()}`, name: "Ingredient", type: "INGREDIENT", unit: "KG", isCoreStock: true } });
      await prisma.purchaseOrderLine.create({
        data: { purchaseOrderId: id, productId: p.id, qty: 10, unitPriceHT: 1, tvaPct: 5.5, isCoreItem: true },
      });
      const res = await request(app).post(`/purchase-orders/${id}/submit`).set(authHeader(token)).send({});
      expect([200, 409, 422]).toContain(res.status);
    },
  ],
});
