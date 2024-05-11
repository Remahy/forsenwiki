-- CreateTable
CREATE TABLE "WhitelistedAccounts" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,

    CONSTRAINT "WhitelistedAccounts_pkey" PRIMARY KEY ("id")
);
