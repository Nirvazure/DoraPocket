ALTER TABLE "MarketSubmission" ADD COLUMN IF NOT EXISTS "dedupCheckedAt" TIMESTAMP(3);
ALTER TABLE "MarketSubmission" ADD COLUMN IF NOT EXISTS "duplicateSimilarity" DOUBLE PRECISION;

CREATE INDEX IF NOT EXISTS "MarketSubmission_dedup_pending_idx"
  ON "MarketSubmission" ("dedupCheckedAt")
  WHERE "dedupCheckedAt" IS NULL AND "status" = 'review';
