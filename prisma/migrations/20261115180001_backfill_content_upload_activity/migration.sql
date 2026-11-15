-- Backfill: every stored upload. Whether it was standalone or part of an article save is not recorded.
INSERT INTO "Activity" ("id", "type", "userId", "contentId", "createdTimestamp")
SELECT gen_random_uuid()::text, 'CONTENT_UPLOAD'::"ActivityType", "authorId", "id", "createdTimestamp"
FROM "Content";
