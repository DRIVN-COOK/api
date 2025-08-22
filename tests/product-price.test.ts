import { crudTestSuite } from "./helpers/crudSuite";
import { prisma } from "./setup";

crudTestSuite("ProductPrice", {
  basePath: "/product-prices",
  makeCreate: async () => {
    const p = await prisma.product.create({ data: { sku: `SKU-${Date.now()}`, name: "Pain", type: "MISC", unit: "UNIT", isCoreStock: true } });
    return { productId: p.id, validFrom: new Date(), priceHT: 2.5, tvaPct: 5.5 };
  },
  makeUpdate: () => ({ priceHT: 2.7 }),
});
