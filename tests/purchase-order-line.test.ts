import { crudTestSuite } from "./helpers/crudSuite";
import { uniqueSiren } from "./helpers/data";
import { prisma } from "./setup";

crudTestSuite("PurchaseOrderLine", {
  basePath: "/purchase-order-lines",
  makeCreate: async () => {
    const f = await prisma.franchisee.create({ data: { name: `Fr-${Date.now()}`, siren: uniqueSiren() } });
    const w = await prisma.warehouse.create({ data: { name: `WH-${Date.now()}` } });
    const po = await prisma.purchaseOrder.create({ data: { franchiseeId: f.id, warehouseId: w.id } });
    const p = await prisma.product.create({ data: { sku: `SKU-${Date.now()}`, name: "Fromage", type: "INGREDIENT", unit: "KG", isCoreStock: true } });
    return { purchaseOrderId: po.id, productId: p.id, qty: 2, unitPriceHT: 3, tvaPct: 5.5, isCoreItem: true };
  },
  makeUpdate: () => ({ qty: 3 }),
});
