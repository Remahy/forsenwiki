-- CreateTable
CREATE TABLE "Html" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "content" TEXT NOT NULL,

    CONSTRAINT "Html_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Html_postId_key" ON "Html"("postId");

-- AddForeignKey
ALTER TABLE "Html" ADD CONSTRAINT "Html_postId_fkey" FOREIGN KEY ("postId") REFERENCES "YPost"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
