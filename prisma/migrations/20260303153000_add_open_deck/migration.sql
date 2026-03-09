CREATE TYPE "OpenDeckStatus" AS ENUM ('pending', 'approved', 'rejected', 'cancelled');

CREATE TABLE "OpenDeckReservation" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "userEmail" TEXT,
  "requesterName" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "djName" TEXT NOT NULL,
  "genre" TEXT NOT NULL,
  "setDuration" INTEGER NOT NULL DEFAULT 60,
  "preferredDate" TIMESTAMP(3) NOT NULL,
  "preferredTime" TEXT,
  "socialUrl" TEXT,
  "note" TEXT,
  "status" "OpenDeckStatus" NOT NULL DEFAULT 'pending',
  "adminNote" TEXT,
  "approvedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "OpenDeckReservation_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "OpenDeckReservation_status_preferredDate_idx" ON "OpenDeckReservation"("status", "preferredDate");
CREATE INDEX "OpenDeckReservation_createdAt_idx" ON "OpenDeckReservation"("createdAt");
CREATE INDEX "OpenDeckReservation_userId_idx" ON "OpenDeckReservation"("userId");
CREATE INDEX "OpenDeckReservation_userEmail_idx" ON "OpenDeckReservation"("userEmail");
