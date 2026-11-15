-- AlterEnum
ALTER TYPE "ActivityType" ADD VALUE 'CONTENT_UPLOAD';

-- AlterTable
ALTER TABLE "Activity" ADD COLUMN "contentId" TEXT;

-- CreateIndex
CREATE INDEX "Activity_contentId_idx" ON "Activity"("contentId");

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "Content"("id") ON DELETE CASCADE ON UPDATE CASCADE;
