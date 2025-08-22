import { crudTestSuite } from "./helpers/crudSuite";
import { prisma } from "./setup";

crudTestSuite("User", {
  basePath: "/users",
  makeCreate: () => ({ email: `john${Date.now()}@ex.com`, passwordHash: "hashed_password_12345", role: "USER" }),
  makeUpdate: () => ({ firstName: "John", lastName: "Doe" }),
});
