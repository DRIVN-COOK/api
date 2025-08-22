import { crudTestSuite } from "./helpers/crudSuite";
import { prisma } from "./setup";

crudTestSuite("LoyaltyCard", {
  basePath: "/loyalty-cards",
  makeCreate: async () => {
    const u = await prisma.user.create({ data: { email: `lc${Date.now()}@ex.com`, passwordHash: "hashhashhash", role: "CUSTOMER" } });
    const c = await prisma.customer.create({ data: { userId: u.id } });
    return { customerId: c.id, cardNumber: `CARD-${Date.now()}`, points: 0, tier: "BASIC" };
  },
  makeUpdate: () => ({ points: 10, tier: "SILVER" }),
});
