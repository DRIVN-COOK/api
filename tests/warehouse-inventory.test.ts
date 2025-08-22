import { crudTestSuite } from "./helpers/crudSuite";
import { prisma } from "./setup";

crudTestSuite("WarehouseInventory", {
  basePath: "/warehouse-inventories",
  makeCreate: async () => {
    const w = await prisma.warehouse.create({ data: { name: `WH-${Date.now()}` } });
    const p = await prisma.product.create({ data: { sku: `SKU-${Date.now()}`, name: "Boisson", type: "BEVERAGE", unit: "L", isCoreStock: true } });
    return { warehouseId: w.id, productId: p.id, onHand: 10, reserved: 0 };
  },
  makeUpdate: () => ({ onHand: 12 }),
});
