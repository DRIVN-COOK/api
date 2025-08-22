import { crudTestSuite } from "./helpers/crudSuite";
import { uniqueSiren } from "./helpers/data";
import { prisma } from "./setup";

crudTestSuite("CustomerOrderLine", {
  basePath: "/customer-order-lines",
  makeCreate: async () => {
    const u = await prisma.user.create({ data: { email: `co${Date.now()}@ex.com`, passwordHash: "hashhashhash", role: "CUSTOMER" } });
    const c = await prisma.customer.create({ data: { userId: u.id } });
    const f = await prisma.franchisee.create({ data: { name: `Fr-${Date.now()}`, siren: uniqueSiren() } });
    const co = await prisma.customerOrder.create({ data: { customerId: c.id, franchiseeId: f.id, totalHT: 5, totalTVA: 0.5, totalTTC: 5.5 } });
    const mi = await prisma.menuItem.create({ data: { name: `Item-${Date.now()}`, priceHT: 5, tvaPct: 10, isActive: true } });
    return { customerOrderId: co.id, menuItemId: mi.id, qty: 1, unitPriceHT: 5, tvaPct: 10, lineTotalHT: 5 };
  },
  makeUpdate: () => ({ qty: 2 }),
});
