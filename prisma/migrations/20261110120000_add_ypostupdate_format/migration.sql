-- CreateEnum
CREATE TYPE "YPostUpdateFormat" AS ENUM ('YJS13', 'LEXICAL_Y');

-- AlterTable
ALTER TABLE "YPostUpdate" ADD COLUMN     "format" "YPostUpdateFormat" NOT NULL DEFAULT 'YJS13';
