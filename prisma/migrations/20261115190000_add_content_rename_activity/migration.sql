-- AlterEnum
ALTER TYPE "ActivityType" ADD VALUE 'CONTENT_RENAME';

-- AlterTable
ALTER TABLE "Activity" ADD COLUMN "oldName" TEXT,
ADD COLUMN "newName" TEXT;
