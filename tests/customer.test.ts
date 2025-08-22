import { crudTestSuite } from "./helpers/crudSuite";
import { prisma } from "./setup";

crudTestSuite("Customer", {
  basePath: "/customers",
  makeCreate: async () => {
    const u = await prisma.user.create({ data: { email: `c${Date.now()}@ex.com`, passwordHash: "hashhashhash", role: "CUSTOMER" } });
    return { userId: u.id, defaultCity: "Paris", defaultZip: "75001" };
  },
  makeUpdate: () => ({ defaultCity: "Lyon" }),
});
