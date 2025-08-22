import { crudTestSuite } from "./helpers/crudSuite";
import { uniqueSiren } from "./helpers/data";

crudTestSuite("Franchisee", {
  basePath: "/franchisees",
  makeCreate: () => ({ name: `Fr-${Date.now()}`, siren: uniqueSiren(), contactEmail: "f@ex.com" }),
  makeUpdate: () => ({ contactPhone: "0600000000" }),
});
