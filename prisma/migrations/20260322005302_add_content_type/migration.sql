-- AlterTable
ALTER TABLE "Content" ADD COLUMN     "type" TEXT;

-- Populate existing rows
UPDATE "Content" SET "type" = 'image';
