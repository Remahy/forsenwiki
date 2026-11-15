-- AlterEnum: recreated rather than extended, a value added with ADD VALUE cannot be used by the backfill in the same transaction.
CREATE TYPE "ActivityType_new" AS ENUM ('ARTICLE_CREATE', 'ARTICLE_UPDATE', 'ARTICLE_RENAME', 'ARTICLE_RETAG', 'USER_REGISTER', 'CONTENT_UPLOAD', 'CONTENT_DELETE', 'CONTENT_RENAME');
ALTER TABLE "Activity" ALTER COLUMN "type" TYPE "ActivityType_new" USING ("type"::text::"ActivityType_new");
DROP TYPE "ActivityType";
ALTER TYPE "ActivityType_new" RENAME TO "ActivityType";

-- AlterTable
ALTER TABLE "Activity" ADD COLUMN "contentId" TEXT,
ADD COLUMN "contentSnapshot" JSONB,
ADD COLUMN "oldName" TEXT,
ADD COLUMN "newName" TEXT,
ADD COLUMN "oldTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "newTags" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateIndex
CREATE INDEX "Activity_contentId_idx" ON "Activity"("contentId");

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "Content"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill: every stored upload. Whether it was standalone or part of an article save is not recorded.
INSERT INTO "Activity" ("id", "type", "userId", "contentId", "createdTimestamp")
SELECT gen_random_uuid()::text, 'CONTENT_UPLOAD'::"ActivityType", "authorId", "id", "createdTimestamp"
FROM "Content";
