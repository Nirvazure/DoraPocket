CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE "Tool" ADD COLUMN IF NOT EXISTS "embedding" vector(1024);
ALTER TABLE "Tool" ADD COLUMN IF NOT EXISTS "embeddingModel" TEXT;
ALTER TABLE "Tool" ADD COLUMN IF NOT EXISTS "embeddingContentHash" TEXT;
ALTER TABLE "Tool" ADD COLUMN IF NOT EXISTS "embeddedAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "Tool_embedding_hnsw_idx"
  ON "Tool" USING hnsw ("embedding" vector_cosine_ops)
  WHERE "embedding" IS NOT NULL AND "status" = 'active';
