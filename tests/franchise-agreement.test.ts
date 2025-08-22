import { crudTestSuite } from "./helpers/crudSuite";
import { uniqueSiren } from "./helpers/data";
import { prisma } from "./setup";

crudTestSuite("FranchiseAgreement", {
  basePath: "/franchise-agreements",
  makeCreate: async () => {
    const f = await prisma.franchisee.create({ data: { name: `Fr-${Date.now()}`, siren: uniqueSiren() } });
    return { franchiseeId: f.id, startDate: new Date(), entryFeeAmount: 10000, revenueSharePct: 0.04 };
  },
  makeUpdate: () => ({ notes: "updated" }),
});
