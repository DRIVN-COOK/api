import { crudTestSuite } from "./helpers/crudSuite";

crudTestSuite("Supplier", {
  basePath: "/suppliers",
  makeCreate: () => ({ name: `Sup-${Date.now()}`, contactEmail: "sup@ex.com" }),
  makeUpdate: () => ({ active: false }),
});
