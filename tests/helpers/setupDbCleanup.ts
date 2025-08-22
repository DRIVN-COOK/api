import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function resetDbForAuth() {
  await prisma.$transaction([
    prisma.refreshToken.deleteMany({}),
    prisma.customerOrderLine.deleteMany({}),
    prisma.payment.deleteMany({}),
    prisma.invoice.deleteMany({}),
    prisma.customerOrder.deleteMany({}),
    prisma.loyaltyTransaction.deleteMany({}),
    prisma.loyaltyCard.deleteMany({}),
    prisma.customer.deleteMany({}),
    prisma.franchiseUser.deleteMany({}),
    prisma.auditLog.deleteMany({}),
    prisma.user.deleteMany({}), // <- maintenant OK
  ]);
}
