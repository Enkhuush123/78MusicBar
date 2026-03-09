CREATE TYPE "CollectionCategory" AS ENUM ('artist', 'dj', 'live_band');

CREATE TABLE "CollectionItem" (
  "id" TEXT NOT NULL,
  "category" "CollectionCategory" NOT NULL,
  "nameEn" TEXT NOT NULL,
  "nameMn" TEXT NOT NULL,
  "infoEn" TEXT NOT NULL,
  "infoMn" TEXT NOT NULL,
  "imageUrl" TEXT,
  "sort" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "CollectionItem_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CollectionItem_category_isActive_sort_idx"
  ON "CollectionItem"("category", "isActive", "sort");
