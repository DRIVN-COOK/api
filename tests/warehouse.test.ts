import { crudTestSuite } from "./helpers/crudSuite";

crudTestSuite("Warehouse", {
  basePath: "/warehouses",
  makeCreate: () => ({ name: `WH-${Date.now()}`, city: "Paris" }),
  makeUpdate: () => ({ city: "Lyon" }),
  publicList: true,
  publicGet: true,
});
