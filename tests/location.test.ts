import { crudTestSuite } from "./helpers/crudSuite";

crudTestSuite("Location", {
  basePath: "/locations",
  makeCreate: () => ({ name: `Spot-${Date.now()}`, city: "Paris" }),
  makeUpdate: () => ({ city: "Lyon" }),
  publicList: true,
  publicGet: true,
});
