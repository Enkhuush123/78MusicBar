-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "isFeatured" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "HomeHero" (
    "id" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "headline" TEXT NOT NULL DEFAULT 'Эвентүүд, тав тухтай орчин',
    "subheadline" TEXT NOT NULL DEFAULT 'Ширээгээ урьдчилж захиалаарай.',
    "ctaText" TEXT NOT NULL DEFAULT 'Эвентүүд үзэх',
    "ctaHref" TEXT NOT NULL DEFAULT '/events',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomeHero_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HomeImage" (
    "id" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "sort" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomeImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HomeHero_isActive_idx" ON "HomeHero"("isActive");

-- CreateIndex
CREATE INDEX "HomeImage_isActive_sort_idx" ON "HomeImage"("isActive", "sort");

-- CreateIndex
CREATE INDEX "Event_isFeatured_idx" ON "Event"("isFeatured");
