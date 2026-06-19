-- CreateEnum
CREATE TYPE "PostRangeType" AS ENUM ('REACTION');

-- CreateTable
CREATE TABLE "YPostRelativeRange" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "PostRangeType" NOT NULL,
    "postId" TEXT NOT NULL,
    "anchor" TEXT NOT NULL,
    "focus" TEXT NOT NULL,
    "content" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "YPostRelativeRange_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "YPostRelativeRange_postId_key" ON "YPostRelativeRange"("postId");

-- AddForeignKey
ALTER TABLE "YPostRelativeRange" ADD CONSTRAINT "YPostRelativeRange_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "YPostRelativeRange" ADD CONSTRAINT "YPostRelativeRange_postId_fkey" FOREIGN KEY ("postId") REFERENCES "YPost"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
