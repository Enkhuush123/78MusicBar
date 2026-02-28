/*
  Warnings:

  - You are about to drop the column `currency` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `imageUrl` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `isPublished` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `venue` on the `Event` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[eventId,reservedFor,tableNo]` on the table `Reservation` will be added. If there are existing duplicate values, this will fail.
  - Made the column `endsAt` on table `Event` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `eventId` to the `Reservation` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Event_startsAt_idx";

-- DropIndex
DROP INDEX "Reservation_reservedFor_idx";

-- DropIndex
DROP INDEX "Reservation_reservedFor_tableNo_key";

-- DropIndex
DROP INDEX "Reservation_userId_idx";

-- AlterTable
ALTER TABLE "Event" DROP COLUMN "currency",
DROP COLUMN "description",
DROP COLUMN "imageUrl",
DROP COLUMN "isPublished",
DROP COLUMN "price",
DROP COLUMN "venue",
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ALTER COLUMN "endsAt" SET NOT NULL;

-- AlterTable
ALTER TABLE "Reservation" ADD COLUMN     "eventId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "Reservation_eventId_reservedFor_idx" ON "Reservation"("eventId", "reservedFor");

-- CreateIndex
CREATE UNIQUE INDEX "Reservation_eventId_reservedFor_tableNo_key" ON "Reservation"("eventId", "reservedFor", "tableNo");

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
