/*
  Warnings:

  - You are about to drop the column `isActive` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `eventId` on the `Reservation` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[reservedFor,tableNo]` on the table `Reservation` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Reservation" DROP CONSTRAINT "Reservation_eventId_fkey";

-- DropIndex
DROP INDEX "Reservation_eventId_reservedFor_idx";

-- DropIndex
DROP INDEX "Reservation_eventId_reservedFor_tableNo_key";

-- AlterTable
ALTER TABLE "Event" DROP COLUMN "isActive",
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'MNT',
ADD COLUMN     "description" TEXT,
ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "isPublished" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "price" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "venue" TEXT NOT NULL DEFAULT '78MusicBar',
ALTER COLUMN "endsAt" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Reservation" DROP COLUMN "eventId";

-- CreateIndex
CREATE INDEX "Event_startsAt_idx" ON "Event"("startsAt");

-- CreateIndex
CREATE INDEX "Reservation_reservedFor_idx" ON "Reservation"("reservedFor");

-- CreateIndex
CREATE INDEX "Reservation_userId_idx" ON "Reservation"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Reservation_reservedFor_tableNo_key" ON "Reservation"("reservedFor", "tableNo");
