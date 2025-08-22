import { crudTestSuite } from "./helpers/crudSuite";
import { uniqueSiren } from "./helpers/data";
import { prisma } from "./setup";

crudTestSuite("Event", {
  basePath: "/events",
  makeCreate: async () => {
    const f = await prisma.franchisee.create({ data: { name: `Fr-${Date.now()}`, siren: uniqueSiren() } });
    return { franchiseeId: f.id, title: `Event-${Date.now()}`, startAt: new Date(), isPublic: true };
  },
  makeUpdate: () => ({ title: "Event-updated" }),
  publicList: true,
  publicGet: true,
});
