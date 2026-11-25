-- Save draft and Finalise write status. The acceptance migration created the
-- column; the current schema dropped it, so Prisma rejected every save.

ALTER TABLE "WeeklyReport" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'DRAFT';
ALTER TABLE "WeeklyReport" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
