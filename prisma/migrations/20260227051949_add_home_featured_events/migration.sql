-- CreateTable
CREATE TABLE "HomeFeaturedEvent" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "sort" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomeFeaturedEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HomeFeaturedEvent_isActive_sort_idx" ON "HomeFeaturedEvent"("isActive", "sort");

-- CreateIndex
CREATE UNIQUE INDEX "HomeFeaturedEvent_eventId_key" ON "HomeFeaturedEvent"("eventId");

-- AddForeignKey
ALTER TABLE "HomeFeaturedEvent" ADD CONSTRAINT "HomeFeaturedEvent_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
