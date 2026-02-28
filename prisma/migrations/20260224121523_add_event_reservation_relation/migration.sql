-- DropIndex
DROP INDEX "Reservation_eventId_reservedFor_idx";

-- CreateIndex
CREATE INDEX "Reservation_eventId_idx" ON "Reservation"("eventId");

-- CreateIndex
CREATE INDEX "Reservation_reservedFor_idx" ON "Reservation"("reservedFor");
