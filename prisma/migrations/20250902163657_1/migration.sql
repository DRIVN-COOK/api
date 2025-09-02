-- AlterTable
ALTER TABLE "public"."Truck" ADD COLUMN     "warehouseId" TEXT,
ALTER COLUMN "franchiseeId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."Truck" ADD CONSTRAINT "Truck_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "public"."Warehouse"("id") ON DELETE SET NULL ON UPDATE CASCADE;
