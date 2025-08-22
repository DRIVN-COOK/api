import { crudTestSuite } from "./helpers/crudSuite";

crudTestSuite("Product", {
  basePath: "/products",
  makeCreate: () => ({ sku: `SKU-${Date.now()}`, name: "Tomate", type: "INGREDIENT", unit: "KG", isCoreStock: true }),
  makeUpdate: () => ({ name: "Tomate Roma", active: true }),
  publicList: true,
  publicGet: true,
});
