-- CreateTable
CREATE TABLE "Reservation" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "guests" INTEGER NOT NULL DEFAULT 2,
    "reservedFor" TIMESTAMP(3) NOT NULL,
    "tableNo" INTEGER NOT NULL,
    "note" TEXT,
    "status" TEXT NOT NULL DEFAULT 'new',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reservation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Reservation_reservedFor_idx" ON "Reservation"("reservedFor");

-- CreateIndex
CREATE UNIQUE INDEX "Reservation_reservedFor_tableNo_key" ON "Reservation"("reservedFor", "tableNo");
