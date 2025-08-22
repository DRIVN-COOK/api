import { crudTestSuite } from "./helpers/crudSuite";
import { uniqueSiren } from "./helpers/data";
import { prisma } from "./setup";

crudTestSuite("TruckDeployment", {
  basePath: "/truck-deployments",
  makeCreate: async () => {
    const f = await prisma.franchisee.create({ data: { name: `Fr-${Date.now()}`, siren: uniqueSiren() } });
    const t = await prisma.truck.create({ data: { franchiseeId: f.id, vin: `VIN${Date.now()}`, plateNumber: `ZZ-${Date.now().toString().slice(-4)}-ZZ` } });
    return { truckId: t.id, franchiseeId: f.id, plannedStart: new Date() };
  },
  makeUpdate: () => ({ notes: "updated" }),
});
