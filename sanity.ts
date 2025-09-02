import { PrismaClient, Prisma } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  await prisma.$transaction(async (tx) => {
    await tx.truckInventory.findFirst(); // doit être reconnu par TS
    await tx.stockMovement.create({
      data: {
        productId: '00000000-0000-0000-0000-000000000000',
        qty: new Prisma.Decimal(1),
        type: 'ADJUSTMENT',
        truckId: '00000000-0000-0000-0000-000000000000',
      },
    });
  });
}
main();
