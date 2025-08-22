-- CreateEnum
CREATE TYPE "public"."TruckStatus" AS ENUM ('AVAILABLE', 'DEPLOYED', 'IN_MAINTENANCE', 'OUT_OF_SERVICE');

-- CreateEnum
CREATE TYPE "public"."MaintenanceType" AS ENUM ('SERVICE', 'REPAIR', 'INSPECTION');

-- CreateEnum
CREATE TYPE "public"."MaintenanceStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'DONE');

-- CreateEnum
CREATE TYPE "public"."ProductType" AS ENUM ('INGREDIENT', 'PREPARED_DISH', 'BEVERAGE', 'MISC');

-- CreateEnum
CREATE TYPE "public"."Unit" AS ENUM ('KG', 'L', 'UNIT');

-- CreateEnum
CREATE TYPE "public"."StockMoveType" AS ENUM ('PURCHASE_IN', 'TRANSFER_IN', 'TRANSFER_OUT', 'SALE_OUT', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "public"."POStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'PREPARING', 'READY', 'DELIVERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."Channel" AS ENUM ('IN_PERSON', 'ONLINE_PREORDER');

-- CreateEnum
CREATE TYPE "public"."OrderStatus" AS ENUM ('PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'FULFILLED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."PaymentProvider" AS ENUM ('CARD', 'CASH', 'ONLINE');

-- CreateEnum
CREATE TYPE "public"."PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "public"."LoyaltyTier" AS ENUM ('BASIC', 'SILVER', 'GOLD');

-- CreateEnum
CREATE TYPE "public"."LoyaltyTxnType" AS ENUM ('EARN', 'SPEND', 'ADJUST');

-- CreateEnum
CREATE TYPE "public"."EventRegStatus" AS ENUM ('REGISTERED', 'CANCELLED', 'ATTENDED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."Role" ADD VALUE 'HQ_STAFF';
ALTER TYPE "public"."Role" ADD VALUE 'FRANCHISE_OWNER';
ALTER TYPE "public"."Role" ADD VALUE 'TRUCK_STAFF';
ALTER TYPE "public"."Role" ADD VALUE 'CUSTOMER';

-- CreateTable
CREATE TABLE "public"."Customer" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "phone" TEXT,
    "defaultCity" TEXT,
    "defaultZip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FranchiseUser" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "franchiseeId" TEXT NOT NULL,
    "roleInFranchise" TEXT,

    CONSTRAINT "FranchiseUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Franchisee" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "siren" TEXT NOT NULL,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "billingAddress" TEXT,
    "joinDate" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "defaultWarehouseId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Franchisee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FranchiseAgreement" (
    "id" TEXT NOT NULL,
    "franchiseeId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "entryFeeAmount" DECIMAL(12,2) NOT NULL,
    "revenueSharePct" DECIMAL(5,4) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FranchiseAgreement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Location" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "postalCode" TEXT,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "isRecurringSpot" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Truck" (
    "id" TEXT NOT NULL,
    "franchiseeId" TEXT NOT NULL,
    "vin" TEXT NOT NULL,
    "plateNumber" TEXT NOT NULL,
    "model" TEXT,
    "purchaseDate" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "currentStatus" "public"."TruckStatus" NOT NULL DEFAULT 'AVAILABLE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Truck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TruckDeployment" (
    "id" TEXT NOT NULL,
    "truckId" TEXT NOT NULL,
    "franchiseeId" TEXT NOT NULL,
    "locationId" TEXT,
    "plannedStart" TIMESTAMP(3) NOT NULL,
    "plannedEnd" TIMESTAMP(3),
    "actualStart" TIMESTAMP(3),
    "actualEnd" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TruckDeployment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TruckMaintenance" (
    "id" TEXT NOT NULL,
    "truckId" TEXT NOT NULL,
    "type" "public"."MaintenanceType" NOT NULL DEFAULT 'SERVICE',
    "status" "public"."MaintenanceStatus" NOT NULL DEFAULT 'PLANNED',
    "scheduledAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "cost" DECIMAL(12,2),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TruckMaintenance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Warehouse" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "postalCode" TEXT,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "hasKitchen" BOOLEAN NOT NULL DEFAULT true,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Warehouse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Supplier" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "address" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Product" (
    "id" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "public"."ProductType" NOT NULL DEFAULT 'INGREDIENT',
    "unit" "public"."Unit" NOT NULL DEFAULT 'UNIT',
    "isCoreStock" BOOLEAN NOT NULL DEFAULT true,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProductPrice" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validTo" TIMESTAMP(3),
    "priceHT" DECIMAL(12,2) NOT NULL,
    "tvaPct" DECIMAL(5,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductPrice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WarehouseInventory" (
    "id" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "onHand" DECIMAL(12,3) NOT NULL,
    "reserved" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WarehouseInventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."StockMovement" (
    "id" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "qty" DECIMAL(12,3) NOT NULL,
    "type" "public"."StockMoveType" NOT NULL,
    "refType" TEXT,
    "refId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PurchaseOrder" (
    "id" TEXT NOT NULL,
    "franchiseeId" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "orderedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "public"."POStatus" NOT NULL DEFAULT 'DRAFT',
    "corePct" DECIMAL(6,5),
    "freePct" DECIMAL(6,5),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PurchaseOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PurchaseOrderLine" (
    "id" TEXT NOT NULL,
    "purchaseOrderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "qty" DECIMAL(12,3) NOT NULL,
    "unitPriceHT" DECIMAL(12,2) NOT NULL,
    "tvaPct" DECIMAL(5,2) NOT NULL,
    "isCoreItem" BOOLEAN NOT NULL,

    CONSTRAINT "PurchaseOrderLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MenuItem" (
    "id" TEXT NOT NULL,
    "productId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priceHT" DECIMAL(12,2) NOT NULL,
    "tvaPct" DECIMAL(5,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MenuItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CustomerOrder" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "franchiseeId" TEXT NOT NULL,
    "truckId" TEXT,
    "warehouseId" TEXT,
    "channel" "public"."Channel" NOT NULL DEFAULT 'IN_PERSON',
    "status" "public"."OrderStatus" NOT NULL DEFAULT 'PENDING',
    "scheduledPickupAt" TIMESTAMP(3),
    "placedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalHT" DECIMAL(12,2) NOT NULL,
    "totalTVA" DECIMAL(12,2) NOT NULL,
    "totalTTC" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CustomerOrderLine" (
    "id" TEXT NOT NULL,
    "customerOrderId" TEXT NOT NULL,
    "menuItemId" TEXT NOT NULL,
    "qty" INTEGER NOT NULL,
    "unitPriceHT" DECIMAL(12,2) NOT NULL,
    "tvaPct" DECIMAL(5,2) NOT NULL,
    "lineTotalHT" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "CustomerOrderLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Payment" (
    "id" TEXT NOT NULL,
    "customerOrderId" TEXT NOT NULL,
    "provider" "public"."PaymentProvider" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "status" "public"."PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paidAt" TIMESTAMP(3),
    "transactionRef" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Invoice" (
    "id" TEXT NOT NULL,
    "customerOrderId" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pdfUrl" TEXT,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."LoyaltyCard" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "cardNumber" TEXT NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "tier" "public"."LoyaltyTier" NOT NULL DEFAULT 'BASIC',
    "printablePdfUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoyaltyCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."LoyaltyTransaction" (
    "id" TEXT NOT NULL,
    "loyaltyCardId" TEXT NOT NULL,
    "type" "public"."LoyaltyTxnType" NOT NULL,
    "points" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "customerId" TEXT,
    "refType" TEXT,
    "refId" TEXT,

    CONSTRAINT "LoyaltyTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Event" (
    "id" TEXT NOT NULL,
    "franchiseeId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3),
    "locationId" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."EventRegistration" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "status" "public"."EventRegStatus" NOT NULL DEFAULT 'REGISTERED',
    "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SalesSummary" (
    "id" TEXT NOT NULL,
    "franchiseeId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "grossHT" DECIMAL(14,2) NOT NULL,
    "grossTVA" DECIMAL(14,2) NOT NULL,
    "grossTTC" DECIMAL(14,2) NOT NULL,
    "ordersCount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SalesSummary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RevenueShareReport" (
    "id" TEXT NOT NULL,
    "franchiseeId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "grossSales" DECIMAL(14,2) NOT NULL,
    "sharePct" DECIMAL(5,4) NOT NULL,
    "amountDue" DECIMAL(14,2) NOT NULL,
    "generatedPdfUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RevenueShareReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AuditLog" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Customer_userId_key" ON "public"."Customer"("userId");

-- CreateIndex
CREATE INDEX "FranchiseUser_franchiseeId_idx" ON "public"."FranchiseUser"("franchiseeId");

-- CreateIndex
CREATE UNIQUE INDEX "FranchiseUser_userId_franchiseeId_key" ON "public"."FranchiseUser"("userId", "franchiseeId");

-- CreateIndex
CREATE UNIQUE INDEX "Franchisee_siren_key" ON "public"."Franchisee"("siren");

-- CreateIndex
CREATE INDEX "FranchiseAgreement_franchiseeId_startDate_idx" ON "public"."FranchiseAgreement"("franchiseeId", "startDate");

-- CreateIndex
CREATE UNIQUE INDEX "Truck_vin_key" ON "public"."Truck"("vin");

-- CreateIndex
CREATE UNIQUE INDEX "Truck_plateNumber_key" ON "public"."Truck"("plateNumber");

-- CreateIndex
CREATE INDEX "Truck_franchiseeId_idx" ON "public"."Truck"("franchiseeId");

-- CreateIndex
CREATE INDEX "TruckDeployment_truckId_plannedStart_idx" ON "public"."TruckDeployment"("truckId", "plannedStart");

-- CreateIndex
CREATE INDEX "TruckDeployment_franchiseeId_plannedStart_idx" ON "public"."TruckDeployment"("franchiseeId", "plannedStart");

-- CreateIndex
CREATE INDEX "TruckDeployment_locationId_plannedStart_idx" ON "public"."TruckDeployment"("locationId", "plannedStart");

-- CreateIndex
CREATE INDEX "TruckMaintenance_truckId_status_idx" ON "public"."TruckMaintenance"("truckId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Product_sku_key" ON "public"."Product"("sku");

-- CreateIndex
CREATE INDEX "Product_type_isCoreStock_idx" ON "public"."Product"("type", "isCoreStock");

-- CreateIndex
CREATE INDEX "ProductPrice_productId_validFrom_idx" ON "public"."ProductPrice"("productId", "validFrom");

-- CreateIndex
CREATE INDEX "WarehouseInventory_productId_idx" ON "public"."WarehouseInventory"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "WarehouseInventory_warehouseId_productId_key" ON "public"."WarehouseInventory"("warehouseId", "productId");

-- CreateIndex
CREATE INDEX "StockMovement_warehouseId_productId_createdAt_idx" ON "public"."StockMovement"("warehouseId", "productId", "createdAt");

-- CreateIndex
CREATE INDEX "StockMovement_refType_refId_idx" ON "public"."StockMovement"("refType", "refId");

-- CreateIndex
CREATE INDEX "PurchaseOrder_franchiseeId_status_idx" ON "public"."PurchaseOrder"("franchiseeId", "status");

-- CreateIndex
CREATE INDEX "PurchaseOrder_warehouseId_status_idx" ON "public"."PurchaseOrder"("warehouseId", "status");

-- CreateIndex
CREATE INDEX "PurchaseOrderLine_purchaseOrderId_idx" ON "public"."PurchaseOrderLine"("purchaseOrderId");

-- CreateIndex
CREATE INDEX "PurchaseOrderLine_productId_idx" ON "public"."PurchaseOrderLine"("productId");

-- CreateIndex
CREATE INDEX "CustomerOrder_franchiseeId_placedAt_idx" ON "public"."CustomerOrder"("franchiseeId", "placedAt");

-- CreateIndex
CREATE INDEX "CustomerOrder_customerId_placedAt_idx" ON "public"."CustomerOrder"("customerId", "placedAt");

-- CreateIndex
CREATE INDEX "CustomerOrder_status_idx" ON "public"."CustomerOrder"("status");

-- CreateIndex
CREATE INDEX "CustomerOrderLine_customerOrderId_idx" ON "public"."CustomerOrderLine"("customerOrderId");

-- CreateIndex
CREATE INDEX "CustomerOrderLine_menuItemId_idx" ON "public"."CustomerOrderLine"("menuItemId");

-- CreateIndex
CREATE INDEX "Payment_customerOrderId_status_idx" ON "public"."Payment"("customerOrderId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_customerOrderId_key" ON "public"."Invoice"("customerOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_invoiceNumber_key" ON "public"."Invoice"("invoiceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "LoyaltyCard_customerId_key" ON "public"."LoyaltyCard"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "LoyaltyCard_cardNumber_key" ON "public"."LoyaltyCard"("cardNumber");

-- CreateIndex
CREATE INDEX "LoyaltyTransaction_loyaltyCardId_createdAt_idx" ON "public"."LoyaltyTransaction"("loyaltyCardId", "createdAt");

-- CreateIndex
CREATE INDEX "Event_franchiseeId_startAt_idx" ON "public"."Event"("franchiseeId", "startAt");

-- CreateIndex
CREATE INDEX "EventRegistration_customerId_status_idx" ON "public"."EventRegistration"("customerId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "EventRegistration_eventId_customerId_key" ON "public"."EventRegistration"("eventId", "customerId");

-- CreateIndex
CREATE INDEX "SalesSummary_period_idx" ON "public"."SalesSummary"("period");

-- CreateIndex
CREATE UNIQUE INDEX "SalesSummary_franchiseeId_period_key" ON "public"."SalesSummary"("franchiseeId", "period");

-- CreateIndex
CREATE INDEX "RevenueShareReport_period_idx" ON "public"."RevenueShareReport"("period");

-- CreateIndex
CREATE UNIQUE INDEX "RevenueShareReport_franchiseeId_period_key" ON "public"."RevenueShareReport"("franchiseeId", "period");

-- CreateIndex
CREATE INDEX "AuditLog_entity_entityId_createdAt_idx" ON "public"."AuditLog"("entity", "entityId", "createdAt");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_idx" ON "public"."RefreshToken"("userId");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "public"."User"("role");

-- AddForeignKey
ALTER TABLE "public"."Customer" ADD CONSTRAINT "Customer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FranchiseUser" ADD CONSTRAINT "FranchiseUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FranchiseUser" ADD CONSTRAINT "FranchiseUser_franchiseeId_fkey" FOREIGN KEY ("franchiseeId") REFERENCES "public"."Franchisee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Franchisee" ADD CONSTRAINT "Franchisee_defaultWarehouseId_fkey" FOREIGN KEY ("defaultWarehouseId") REFERENCES "public"."Warehouse"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FranchiseAgreement" ADD CONSTRAINT "FranchiseAgreement_franchiseeId_fkey" FOREIGN KEY ("franchiseeId") REFERENCES "public"."Franchisee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Truck" ADD CONSTRAINT "Truck_franchiseeId_fkey" FOREIGN KEY ("franchiseeId") REFERENCES "public"."Franchisee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TruckDeployment" ADD CONSTRAINT "TruckDeployment_truckId_fkey" FOREIGN KEY ("truckId") REFERENCES "public"."Truck"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TruckDeployment" ADD CONSTRAINT "TruckDeployment_franchiseeId_fkey" FOREIGN KEY ("franchiseeId") REFERENCES "public"."Franchisee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TruckDeployment" ADD CONSTRAINT "TruckDeployment_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "public"."Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TruckMaintenance" ADD CONSTRAINT "TruckMaintenance_truckId_fkey" FOREIGN KEY ("truckId") REFERENCES "public"."Truck"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProductPrice" ADD CONSTRAINT "ProductPrice_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WarehouseInventory" ADD CONSTRAINT "WarehouseInventory_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "public"."Warehouse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WarehouseInventory" ADD CONSTRAINT "WarehouseInventory_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StockMovement" ADD CONSTRAINT "StockMovement_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "public"."Warehouse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StockMovement" ADD CONSTRAINT "StockMovement_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_franchiseeId_fkey" FOREIGN KEY ("franchiseeId") REFERENCES "public"."Franchisee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "public"."Warehouse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PurchaseOrderLine" ADD CONSTRAINT "PurchaseOrderLine_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "public"."PurchaseOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PurchaseOrderLine" ADD CONSTRAINT "PurchaseOrderLine_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MenuItem" ADD CONSTRAINT "MenuItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CustomerOrder" ADD CONSTRAINT "CustomerOrder_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CustomerOrder" ADD CONSTRAINT "CustomerOrder_franchiseeId_fkey" FOREIGN KEY ("franchiseeId") REFERENCES "public"."Franchisee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CustomerOrder" ADD CONSTRAINT "CustomerOrder_truckId_fkey" FOREIGN KEY ("truckId") REFERENCES "public"."Truck"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CustomerOrder" ADD CONSTRAINT "CustomerOrder_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "public"."Warehouse"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CustomerOrderLine" ADD CONSTRAINT "CustomerOrderLine_customerOrderId_fkey" FOREIGN KEY ("customerOrderId") REFERENCES "public"."CustomerOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CustomerOrderLine" ADD CONSTRAINT "CustomerOrderLine_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "public"."MenuItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Payment" ADD CONSTRAINT "Payment_customerOrderId_fkey" FOREIGN KEY ("customerOrderId") REFERENCES "public"."CustomerOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Invoice" ADD CONSTRAINT "Invoice_customerOrderId_fkey" FOREIGN KEY ("customerOrderId") REFERENCES "public"."CustomerOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LoyaltyCard" ADD CONSTRAINT "LoyaltyCard_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LoyaltyTransaction" ADD CONSTRAINT "LoyaltyTransaction_loyaltyCardId_fkey" FOREIGN KEY ("loyaltyCardId") REFERENCES "public"."LoyaltyCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LoyaltyTransaction" ADD CONSTRAINT "LoyaltyTransaction_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Event" ADD CONSTRAINT "Event_franchiseeId_fkey" FOREIGN KEY ("franchiseeId") REFERENCES "public"."Franchisee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Event" ADD CONSTRAINT "Event_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "public"."Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EventRegistration" ADD CONSTRAINT "EventRegistration_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "public"."Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EventRegistration" ADD CONSTRAINT "EventRegistration_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SalesSummary" ADD CONSTRAINT "SalesSummary_franchiseeId_fkey" FOREIGN KEY ("franchiseeId") REFERENCES "public"."Franchisee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RevenueShareReport" ADD CONSTRAINT "RevenueShareReport_franchiseeId_fkey" FOREIGN KEY ("franchiseeId") REFERENCES "public"."Franchisee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AuditLog" ADD CONSTRAINT "AuditLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
