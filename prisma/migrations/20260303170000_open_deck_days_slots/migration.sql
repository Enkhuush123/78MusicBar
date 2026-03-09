ALTER TABLE "OpenDeckReservation" ADD COLUMN "slotId" TEXT;

CREATE TABLE "OpenDeckDay" (
  "id" TEXT NOT NULL,
  "eventDate" TIMESTAMP(3) NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "OpenDeckDay_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OpenDeckSlot" (
  "id" TEXT NOT NULL,
  "dayId" TEXT NOT NULL,
  "startsAt" TIMESTAMP(3) NOT NULL,
  "endsAt" TIMESTAMP(3) NOT NULL,
  "sort" INTEGER NOT NULL DEFAULT 0,
  "isOpen" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "OpenDeckSlot_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "OpenDeckReservation_slotId_key" ON "OpenDeckReservation"("slotId");
CREATE INDEX "OpenDeckReservation_slotId_idx" ON "OpenDeckReservation"("slotId");

CREATE UNIQUE INDEX "OpenDeckDay_eventDate_key" ON "OpenDeckDay"("eventDate");
CREATE INDEX "OpenDeckDay_eventDate_isActive_idx" ON "OpenDeckDay"("eventDate", "isActive");

CREATE UNIQUE INDEX "OpenDeckSlot_dayId_sort_key" ON "OpenDeckSlot"("dayId", "sort");
CREATE INDEX "OpenDeckSlot_dayId_startsAt_isOpen_idx" ON "OpenDeckSlot"("dayId", "startsAt", "isOpen");

ALTER TABLE "OpenDeckSlot"
  ADD CONSTRAINT "OpenDeckSlot_dayId_fkey"
  FOREIGN KEY ("dayId") REFERENCES "OpenDeckDay"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "OpenDeckReservation"
  ADD CONSTRAINT "OpenDeckReservation_slotId_fkey"
  FOREIGN KEY ("slotId") REFERENCES "OpenDeckSlot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
