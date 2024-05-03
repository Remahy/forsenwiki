-- CreateTable
CREATE TABLE "YPost" (
    "id" TEXT NOT NULL,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdTimestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "YPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "YPostRelation" (
    "isSystem" BOOLEAN NOT NULL,
    "fromPostId" TEXT NOT NULL,
    "toPostId" TEXT NOT NULL,

    CONSTRAINT "YPostRelation_pkey" PRIMARY KEY ("fromPostId","toPostId")
);

-- CreateTable
CREATE TABLE "YPostUpdate" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "metadataId" TEXT NOT NULL,
    "createdTimestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "YPostUpdate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "YPostUpdateMetadata" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "YPostUpdateMetadata_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "YPostUpdate_metadataId_key" ON "YPostUpdate"("metadataId");

-- AddForeignKey
ALTER TABLE "YPostRelation" ADD CONSTRAINT "YPostRelation_fromPostId_fkey" FOREIGN KEY ("fromPostId") REFERENCES "YPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "YPostRelation" ADD CONSTRAINT "YPostRelation_toPostId_fkey" FOREIGN KEY ("toPostId") REFERENCES "YPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "YPostUpdate" ADD CONSTRAINT "YPostUpdate_postId_fkey" FOREIGN KEY ("postId") REFERENCES "YPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "YPostUpdate" ADD CONSTRAINT "YPostUpdate_metadataId_fkey" FOREIGN KEY ("metadataId") REFERENCES "YPostUpdateMetadata"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "YPostUpdateMetadata" ADD CONSTRAINT "YPostUpdateMetadata_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
