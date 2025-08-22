import { crudTestSuite } from "./helpers/crudSuite";
import { uniqueSiren } from "./helpers/data";
import { prisma } from "./setup";

crudTestSuite("Truck", {
  basePath: "/trucks",
  makeCreate: async () => {
    const f = await prisma.franchisee.create({ data: { name: `Fr-${Date.now()}`, siren: uniqueSiren() } });
    return { franchiseeId: f.id, vin: `VIN${Date.now()}`, plateNumber: `AB-${Date.now().toString().slice(-4)}-CD` };
  },
  makeUpdate: () => ({ currentStatus: "DEPLOYED" }),
});
