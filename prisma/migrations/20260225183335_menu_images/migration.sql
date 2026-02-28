/*
  Warnings:

  - You are about to drop the `MenuItem` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "MenuItem";

-- CreateTable
CREATE TABLE "MenuImage" (
    "id" TEXT NOT NULL,
    "category" "MenuCategory" NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "sort" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MenuImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MenuImage_category_sort_idx" ON "MenuImage"("category", "sort");
