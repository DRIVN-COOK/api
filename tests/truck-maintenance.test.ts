import { crudTestSuite } from "./helpers/crudSuite";
import { uniqueSiren } from "./helpers/data";
import { prisma } from "./setup";

crudTestSuite("TruckMaintenance", {
  basePath: "/truck-maintenances",
  makeCreate: async () => {
    const f = await prisma.franchisee.create({ data: { name: `Fr-${Date.now()}`, siren: uniqueSiren() } });
    const t = await prisma.truck.create({ data: { franchiseeId: f.id, vin: `VIN${Date.now()}`, plateNumber: `TT-${Date.now().toString().slice(-4)}-TT` } });
    return { truckId: t.id, type: "SERVICE", status: "PLANNED" };
  },
  makeUpdate: () => ({ status: "DONE" }),
});
