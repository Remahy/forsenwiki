-- CreateTable
CREATE TABLE "YPostUpdateStateCache" (
    "postUpdateId" TEXT NOT NULL,
    "madeBy" TEXT NOT NULL,
    "content" BYTEA NOT NULL,

    CONSTRAINT "YPostUpdateStateCache_pkey" PRIMARY KEY ("postUpdateId")
);

-- AddForeignKey
ALTER TABLE "YPostUpdateStateCache" ADD CONSTRAINT "YPostUpdateStateCache_postUpdateId_fkey" FOREIGN KEY ("postUpdateId") REFERENCES "YPostUpdate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "YPostDiffPageCache" (
    "olderId" TEXT NOT NULL,
    "newerId" TEXT NOT NULL,
    "page" INTEGER NOT NULL,
    "madeBy" TEXT NOT NULL,
    "content" BYTEA NOT NULL,

    CONSTRAINT "YPostDiffPageCache_pkey" PRIMARY KEY ("olderId","newerId","page")
);

-- AddForeignKey
ALTER TABLE "YPostDiffPageCache" ADD CONSTRAINT "YPostDiffPageCache_olderId_fkey" FOREIGN KEY ("olderId") REFERENCES "YPostUpdate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "YPostDiffPageCache" ADD CONSTRAINT "YPostDiffPageCache_newerId_fkey" FOREIGN KEY ("newerId") REFERENCES "YPostUpdate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
