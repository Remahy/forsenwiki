-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('ARTICLE_CREATE', 'ARTICLE_UPDATE', 'ARTICLE_RENAME', 'USER_REGISTER');

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL,
    "type" "ActivityType" NOT NULL,
    "explanation" TEXT,
    "parentId" TEXT,
    "userId" TEXT,
    "postId" TEXT,
    "postUpdateId" TEXT,
    "createdTimestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Activity_createdTimestamp_id_idx" ON "Activity"("createdTimestamp", "id");

-- CreateIndex
CREATE INDEX "Activity_parentId_idx" ON "Activity"("parentId");

-- CreateIndex
CREATE INDEX "Activity_userId_idx" ON "Activity"("userId");

-- CreateIndex
CREATE INDEX "Activity_postUpdateId_idx" ON "Activity"("postUpdateId");

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_postId_fkey" FOREIGN KEY ("postId") REFERENCES "YPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_postUpdateId_fkey" FOREIGN KEY ("postUpdateId") REFERENCES "YPostUpdate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: every stored version of an article is an activity, the first one is the creation.
INSERT INTO "Activity" ("id", "type", "explanation", "userId", "postId", "postUpdateId", "createdTimestamp")
SELECT
    gen_random_uuid()::text,
    CASE WHEN v."version" = 1 THEN 'ARTICLE_CREATE' ELSE 'ARTICLE_UPDATE' END::"ActivityType",
    CASE WHEN v."version" > 1 AND v."userId" = 'system' AND v."format" = 'LEXICAL_Y' THEN 'Converted to a newer format.' END,
    v."userId",
    v."postId",
    v."id",
    v."createdTimestamp"
FROM (
    SELECT
        u."id",
        u."postId",
        u."format",
        u."createdTimestamp",
        m."userId",
        ROW_NUMBER() OVER (PARTITION BY u."postId" ORDER BY u."createdTimestamp", u."id") AS "version"
    FROM "YPostUpdate" u
    JOIN "YPostUpdateMetadata" m ON m."id" = u."metadataId"
) v
WHERE v."postId" <> 'system'
    AND NOT EXISTS (
        SELECT 1 FROM "YPostRelation" r
        WHERE r."fromPostId" = v."postId" AND r."isSystem" AND r."toPostId" = 'system'
    );

-- Backfill: a title change belongs to the update it was made in.
INSERT INTO "Activity" ("id", "type", "parentId", "userId", "postId", "postUpdateId", "createdTimestamp")
SELECT gen_random_uuid()::text, 'ARTICLE_RENAME', e."id", e."userId", e."postId", e."postUpdateId", e."createdTimestamp"
FROM "Activity" e
JOIN "YPostUpdate" u ON u."id" = e."postUpdateId"
JOIN "YPostUpdateMetadata" m ON m."id" = u."metadataId"
WHERE e."type" = 'ARTICLE_UPDATE'
    AND m."newTitle" IS NOT NULL
    AND m."newTitle" IS DISTINCT FROM m."oldTitle";

-- Backfill: registrations.
INSERT INTO "Activity" ("id", "type", "userId", "createdTimestamp")
SELECT gen_random_uuid()::text, 'USER_REGISTER', "id", "createdAt"
FROM "User"
WHERE "id" <> 'system';
