/*
  Warnings:

  - You are about to drop the column `transactionRef` on the `Payment` table. All the data in the column will be lost.
  - You are about to alter the column `amount` on the `Payment` table. The data in that column could be lost. The data in that column will be cast from `Decimal(12,2)` to `Integer`.
  - A unique constraint covering the columns `[franchiseeApplicationId]` on the table `Payment` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[providerSessionId]` on the table `Payment` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[providerPaymentIntentId]` on the table `Payment` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `purpose` to the `Payment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Payment` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."PaymentPurpose" AS ENUM ('ORDER', 'FRANCHISE_ENTRY_FEE');

-- CreateEnum
CREATE TYPE "public"."FranchiseeApplicationStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'CANCELED');

-- AlterEnum
ALTER TYPE "public"."PaymentProvider" ADD VALUE 'STRIPE';

-- DropIndex
DROP INDEX "public"."StockMovement_warehouseId_productId_createdAt_idx";

-- AlterTable
ALTER TABLE "public"."Payment" DROP COLUMN "transactionRef",
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'EUR',
ADD COLUMN     "franchiseeApplicationId" TEXT,
ADD COLUMN     "providerPaymentIntentId" TEXT,
ADD COLUMN     "providerSessionId" TEXT,
ADD COLUMN     "purpose" "public"."PaymentPurpose" NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "customerOrderId" DROP NOT NULL,
ALTER COLUMN "amount" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "public"."Product" ADD COLUMN     "maxPerTruck" DECIMAL(12,3);

-- AlterTable
ALTER TABLE "public"."StockMovement" ADD COLUMN     "truckId" TEXT,
ALTER COLUMN "warehouseId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "public"."TruckInventory" (
    "id" TEXT NOT NULL,
    "truckId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "onHand" DECIMAL(12,3) NOT NULL,
    "reserved" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TruckInventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FranchiseeApplication" (
    "id" TEXT NOT NULL,
    "applicantUserId" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "depotId" TEXT NOT NULL,
    "status" "public"."FranchiseeApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "stripeCheckoutSessionId" TEXT,
    "stripePaymentIntentId" TEXT,
    "franchiseeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FranchiseeApplication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TruckInventory_productId_idx" ON "public"."TruckInventory"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "TruckInventory_truckId_productId_key" ON "public"."TruckInventory"("truckId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "FranchiseeApplication_stripeCheckoutSessionId_key" ON "public"."FranchiseeApplication"("stripeCheckoutSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "FranchiseeApplication_stripePaymentIntentId_key" ON "public"."FranchiseeApplication"("stripePaymentIntentId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_franchiseeApplicationId_key" ON "public"."Payment"("franchiseeApplicationId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_providerSessionId_key" ON "public"."Payment"("providerSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_providerPaymentIntentId_key" ON "public"."Payment"("providerPaymentIntentId");

-- CreateIndex
CREATE INDEX "Payment_provider_purpose_status_idx" ON "public"."Payment"("provider", "purpose", "status");

-- CreateIndex
CREATE INDEX "StockMovement_warehouseId_truckId_productId_createdAt_idx" ON "public"."StockMovement"("warehouseId", "truckId", "productId", "createdAt");

-- AddForeignKey
ALTER TABLE "public"."TruckInventory" ADD CONSTRAINT "TruckInventory_truckId_fkey" FOREIGN KEY ("truckId") REFERENCES "public"."Truck"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TruckInventory" ADD CONSTRAINT "TruckInventory_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StockMovement" ADD CONSTRAINT "StockMovement_truckId_fkey" FOREIGN KEY ("truckId") REFERENCES "public"."Truck"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Payment" ADD CONSTRAINT "Payment_franchiseeApplicationId_fkey" FOREIGN KEY ("franchiseeApplicationId") REFERENCES "public"."FranchiseeApplication"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FranchiseeApplication" ADD CONSTRAINT "FranchiseeApplication_applicantUserId_fkey" FOREIGN KEY ("applicantUserId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FranchiseeApplication" ADD CONSTRAINT "FranchiseeApplication_franchiseeId_fkey" FOREIGN KEY ("franchiseeId") REFERENCES "public"."Franchisee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
