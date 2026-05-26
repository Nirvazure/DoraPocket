CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE OR REPLACE FUNCTION tool_build_search_document(
  name text,
  description text,
  tags text[],
  category text
) RETURNS tsvector
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $$
  SELECT
    setweight(to_tsvector('simple', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(description, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(array_to_string(tags, ' '), '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(category, '')), 'C');
$$;

ALTER TABLE "Tool" ADD COLUMN IF NOT EXISTS "searchDocument" tsvector
  GENERATED ALWAYS AS (
    tool_build_search_document("name", "description", "tags", "category")
  ) STORED;

CREATE INDEX IF NOT EXISTS "Tool_searchDocument_gin_idx"
  ON "Tool" USING GIN ("searchDocument")
  WHERE "status" = 'active';

CREATE INDEX IF NOT EXISTS "Tool_name_trgm_idx"
  ON "Tool" USING GIN ("name" gin_trgm_ops)
  WHERE "status" = 'active';
