-- AlterEnum
ALTER TYPE "ActivityType" ADD VALUE 'CONTENT_UPLOAD';
ALTER TYPE "ActivityType" ADD VALUE 'CONTENT_DELETE';

-- AlterTable
ALTER TABLE "Activity" ADD COLUMN "contentId" TEXT,
ADD COLUMN "contentSnapshot" JSONB;

-- CreateIndex
CREATE INDEX "Activity_contentId_idx" ON "Activity"("contentId");

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "Content"("id") ON DELETE SET NULL ON UPDATE CASCADE;
