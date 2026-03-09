-- Keep old enum values temporarily so we can migrate data safely
ALTER TABLE "CollectionItem" ADD COLUMN "categorySlug" TEXT;
UPDATE "CollectionItem" SET "categorySlug" = "category"::text;

-- Remove enum usage first, then drop enum type (same name as new table)
DROP INDEX IF EXISTS "CollectionItem_category_isActive_sort_idx";
ALTER TABLE "CollectionItem" DROP COLUMN "category";
DROP TYPE IF EXISTS "CollectionCategory";

-- Create dynamic category table
CREATE TABLE "CollectionCategory" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameMn" TEXT NOT NULL,
    "sort" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CollectionCategory_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CollectionCategory_slug_key" ON "CollectionCategory"("slug");
CREATE INDEX "CollectionCategory_isActive_sort_idx" ON "CollectionCategory"("isActive", "sort");

-- Seed default categories
INSERT INTO "CollectionCategory" ("id", "slug", "nameEn", "nameMn", "sort", "isActive", "createdAt", "updatedAt")
VALUES
  ('11111111-1111-4111-8111-111111111111', 'artist', 'Artist Collection', 'Уран бүтээлчид', 0, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('22222222-2222-4222-8222-222222222222', 'dj', 'DJ Collection', 'DJ цуглуулга', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('33333333-3333-4333-8333-333333333333', 'live_band', 'Live Band Collection', 'Амьд хамтлагууд', 2, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("slug") DO NOTHING;

-- Add relation to dynamic categories and backfill from temporary slug
ALTER TABLE "CollectionItem" ADD COLUMN "categoryId" TEXT;
UPDATE "CollectionItem" ci
SET "categoryId" = cc."id"
FROM "CollectionCategory" cc
WHERE cc."slug" = ci."categorySlug";

ALTER TABLE "CollectionItem" ALTER COLUMN "categoryId" SET NOT NULL;
ALTER TABLE "CollectionItem" DROP COLUMN "categorySlug";

CREATE INDEX "CollectionItem_categoryId_isActive_sort_idx" ON "CollectionItem"("categoryId", "isActive", "sort");
ALTER TABLE "CollectionItem"
ADD CONSTRAINT "CollectionItem_categoryId_fkey"
FOREIGN KEY ("categoryId") REFERENCES "CollectionCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
