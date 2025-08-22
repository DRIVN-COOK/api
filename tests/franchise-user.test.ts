import { crudTestSuite } from "./helpers/crudSuite";
import { uniqueSiren } from "./helpers/data";
import { prisma } from "./setup";

crudTestSuite("FranchiseUser", {
  basePath: "/franchise-users",
  makeCreate: async () => {
    const u = await prisma.user.create({ data: { email: `fu${Date.now()}@ex.com`, passwordHash: "hashhashhash", role: "FRANCHISE_OWNER" } });
    const f = await prisma.franchisee.create({ data: { name: `Fr-${Date.now()}`, siren: uniqueSiren()} });
    return { userId: u.id, franchiseeId: f.id, roleInFranchise: "OWNER" };
  },
  makeUpdate: () => ({ roleInFranchise: "MANAGER" }),
});
