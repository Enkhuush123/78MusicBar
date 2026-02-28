-- AlterTable
ALTER TABLE "Reservation" ADD COLUMN     "userEmail" TEXT,
ADD COLUMN     "userId" TEXT,
ADD COLUMN     "userPhone" TEXT,
ALTER COLUMN "name" DROP NOT NULL,
ALTER COLUMN "phone" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "Reservation_userId_idx" ON "Reservation"("userId");
