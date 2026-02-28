/*
  Warnings:

  - A unique constraint covering the columns `[eventId,reservedFor,tableNo]` on the table `Reservation` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `eventId` to the `Reservation` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Reservation_reservedFor_idx";

-- DropIndex
DROP INDEX "Reservation_reservedFor_tableNo_key";

-- AlterTable
ALTER TABLE "Reservation" ADD COLUMN     "eventId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "Reservation_eventId_reservedFor_idx" ON "Reservation"("eventId", "reservedFor");

-- CreateIndex
CREATE UNIQUE INDEX "Reservation_eventId_reservedFor_tableNo_key" ON "Reservation"("eventId", "reservedFor", "tableNo");

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
