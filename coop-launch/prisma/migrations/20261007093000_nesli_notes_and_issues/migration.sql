-- CreateEnum
CREATE TYPE "AppIssueStatus" AS ENUM ('OPEN', 'LOOKING', 'FIXED');

-- CreateTable
CREATE TABLE "CoordinatorNote" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT '',
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "CoordinatorNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppIssueReport" (
    "id" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "pageOrTab" TEXT NOT NULL DEFAULT '',
    "status" "AppIssueStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "AppIssueReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CoordinatorNote_userId_updatedAt_idx" ON "CoordinatorNote"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "AppIssueReport_status_updatedAt_idx" ON "AppIssueReport"("status", "updatedAt");

-- AddForeignKey
ALTER TABLE "CoordinatorNote" ADD CONSTRAINT "CoordinatorNote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppIssueReport" ADD CONSTRAINT "AppIssueReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
