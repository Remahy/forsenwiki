-- CreateTable
CREATE TABLE "YPostContent" (
    "postId" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "postUpdateId" TEXT,
    "createdTimestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "YPostContent_pkey" PRIMARY KEY ("postId","contentId")
);

-- CreateIndex
CREATE INDEX "YPostContent_contentId_idx" ON "YPostContent"("contentId");

-- CreateIndex
CREATE INDEX "YPostContent_postUpdateId_idx" ON "YPostContent"("postUpdateId");

-- AddForeignKey
ALTER TABLE "YPostContent" ADD CONSTRAINT "YPostContent_postId_fkey" FOREIGN KEY ("postId") REFERENCES "YPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "YPostContent" ADD CONSTRAINT "YPostContent_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "Content"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "YPostContent" ADD CONSTRAINT "YPostContent_postUpdateId_fkey" FOREIGN KEY ("postUpdateId") REFERENCES "YPostUpdate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill from the rendered HTML, which links every image, video and subtitle by its hash. The update that added each one is unknown, the article's last edit is the latest it can have been.
INSERT INTO "YPostContent" ("postId", "contentId", "createdTimestamp")
SELECT h."postId", c."id", p."lastUpdated"
FROM "Html" h
JOIN "YPost" p ON p."id" = h."postId"
JOIN "Content" c ON position(c."hash" IN h."content") > 0;
