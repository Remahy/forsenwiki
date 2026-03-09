-- AlterTable
ALTER TABLE "Content" ADD COLUMN     "contentType" TEXT,
ADD COLUMN     "metadata" JSONB NOT NULL DEFAULT '{}';
