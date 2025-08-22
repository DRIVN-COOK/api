import { crudTestSuite } from "./helpers/crudSuite";

crudTestSuite("MenuItem", {
  basePath: "/menu-items",
  makeCreate: () => ({ name: `Burger-${Date.now()}`, priceHT: 8.5, tvaPct: 10, isActive: true }),
  makeUpdate: () => ({ isActive: false }),
  publicList: true,
  publicGet: true,
});
