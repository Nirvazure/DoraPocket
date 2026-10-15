BEGIN;

-- Install only missing extensions. Existing installations retain their original namespace.
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "dorapocket";

-- CreateTable
CREATE TABLE "dorapocket"."User" (
    "id" TEXT NOT NULL,
    "supabaseUserId" TEXT NOT NULL,
    "email" TEXT,
    "nickname" TEXT NOT NULL,
    "avatarSrc" TEXT,
    "bio" TEXT,
    "website" TEXT,
    "company" TEXT,
    "authCreatedAt" TIMESTAMP(3),
    "lastSignInAt" TIMESTAMP(3),
    "authRole" TEXT,
    "authProvider" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dorapocket"."UserSettings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "voicePlaybackEnabled" BOOLEAN NOT NULL DEFAULT true,
    "voicePlaybackMode" TEXT NOT NULL DEFAULT 'key-result',
    "soundEffectsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "defaultInputMode" TEXT NOT NULL DEFAULT 'text',
    "memoryEnabled" BOOLEAN NOT NULL DEFAULT true,
    "explanationMode" TEXT NOT NULL DEFAULT 'standard',
    "fontPreset" TEXT NOT NULL DEFAULT 'c',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dorapocket"."Tool" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "tags" TEXT[] NOT NULL,
    "iconUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "pricingModel" TEXT NOT NULL DEFAULT 'unknown',
    "requiresAuth" BOOLEAN,
    "platform" TEXT NOT NULL DEFAULT 'unknown',
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tool_pkey" PRIMARY KEY ("id")
);

-- CreateTable
DO $vector_table$
DECLARE vector_schema text;
BEGIN
  SELECT n.nspname INTO STRICT vector_schema FROM pg_catalog.pg_extension e
    JOIN pg_catalog.pg_namespace n ON n.oid = e.extnamespace WHERE e.extname = 'vector';
  EXECUTE pg_catalog.format($ddl$CREATE TABLE "dorapocket"."ToolIndex" (
    "toolId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "contentHash" TEXT NOT NULL,
    "searchDocument" pg_catalog.tsvector GENERATED ALWAYS AS (pg_catalog.to_tsvector('pg_catalog.simple'::pg_catalog.regconfig, "content")) STORED,
    "embedding" %I.vector(1024),
    "embeddingModel" TEXT,
    "embeddedAt" TIMESTAMP(3),

    CONSTRAINT "ToolIndex_pkey" PRIMARY KEY ("toolId")
);$ddl$, vector_schema);
END
$vector_table$;

-- CreateTable
CREATE TABLE "dorapocket"."PocketItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "toolId" TEXT NOT NULL,
    "savedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "useCount" INTEGER NOT NULL DEFAULT 0,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "purchased" BOOLEAN NOT NULL DEFAULT false,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "sourceQuestion" TEXT,

    CONSTRAINT "PocketItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dorapocket"."MarketFeedback" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "toolId" TEXT NOT NULL,
    "vote" TEXT NOT NULL,
    "starRating" INTEGER NOT NULL,
    "selectedTags" TEXT[] NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dorapocket"."MarketSubmission" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "toolId" TEXT,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "tags" TEXT[] NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'review',
    "dedupCheckedAt" TIMESTAMP(3),
    "duplicateSimilarity" DOUBLE PRECISION,

    CONSTRAINT "MarketSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dorapocket"."ToolActivity" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "toolId" TEXT NOT NULL,
    "saves" INTEGER NOT NULL DEFAULT 0,
    "opens" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ToolActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dorapocket"."ChatHistoryEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userText" TEXT NOT NULL,
    "assistantText" TEXT NOT NULL,
    "selectedToolId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatHistoryEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dorapocket"."PreferenceProfileOverride" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "preferredCategories" TEXT[] NOT NULL,
    "preferredTags" TEXT[] NOT NULL,
    "preferredPlatforms" TEXT[] NOT NULL,
    "preferredPricing" TEXT[] NOT NULL,
    "avoidAuthWall" BOOLEAN,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PreferenceProfileOverride_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dorapocket"."RecommendationSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userText" TEXT NOT NULL,
    "taskFrame" JSONB NOT NULL,
    "selectedToolId" TEXT,
    "candidates" JSONB NOT NULL,
    "selectionReason" TEXT NOT NULL,
    "selectionSignals" TEXT[] NOT NULL,
    "preferenceSignals" TEXT[] NOT NULL,
    "finalText" TEXT NOT NULL,
    "starterPath" TEXT,
    "clarifyTurnCount" INTEGER NOT NULL DEFAULT 0,
    "confidenceLevel" TEXT,
    "openedToolId" TEXT,
    "savedToolId" TEXT,
    "evaluatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecommendationSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dorapocket"."RecommendationEvaluation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "recommendationSessionId" TEXT NOT NULL,
    "selectedToolId" TEXT,
    "opened" BOOLEAN NOT NULL DEFAULT false,
    "saved" BOOLEAN NOT NULL DEFAULT false,
    "tried" BOOLEAN NOT NULL DEFAULT false,
    "helpful" BOOLEAN,
    "outcome" TEXT,
    "rating" INTEGER,
    "tags" TEXT[] NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecommendationEvaluation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_supabaseUserId_key" ON "dorapocket"."User"("supabaseUserId");

-- CreateIndex
CREATE UNIQUE INDEX "UserSettings_userId_key" ON "dorapocket"."UserSettings"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PocketItem_userId_toolId_key" ON "dorapocket"."PocketItem"("userId", "toolId");

-- CreateIndex
CREATE UNIQUE INDEX "MarketFeedback_userId_toolId_key" ON "dorapocket"."MarketFeedback"("userId", "toolId");

-- CreateIndex
CREATE UNIQUE INDEX "ToolActivity_userId_toolId_key" ON "dorapocket"."ToolActivity"("userId", "toolId");

-- CreateIndex
CREATE UNIQUE INDEX "PreferenceProfileOverride_userId_key" ON "dorapocket"."PreferenceProfileOverride"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "RecommendationEvaluation_userId_recommendationSessionId_key" ON "dorapocket"."RecommendationEvaluation"("userId", "recommendationSessionId");

-- AddForeignKey
ALTER TABLE "dorapocket"."UserSettings" ADD CONSTRAINT "UserSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "dorapocket"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dorapocket"."Tool" ADD CONSTRAINT "Tool_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "dorapocket"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dorapocket"."ToolIndex" ADD CONSTRAINT "ToolIndex_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "dorapocket"."Tool"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dorapocket"."PocketItem" ADD CONSTRAINT "PocketItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "dorapocket"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dorapocket"."PocketItem" ADD CONSTRAINT "PocketItem_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "dorapocket"."Tool"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dorapocket"."MarketFeedback" ADD CONSTRAINT "MarketFeedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "dorapocket"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dorapocket"."MarketFeedback" ADD CONSTRAINT "MarketFeedback_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "dorapocket"."Tool"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dorapocket"."MarketSubmission" ADD CONSTRAINT "MarketSubmission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "dorapocket"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dorapocket"."ToolActivity" ADD CONSTRAINT "ToolActivity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "dorapocket"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dorapocket"."ToolActivity" ADD CONSTRAINT "ToolActivity_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "dorapocket"."Tool"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dorapocket"."ChatHistoryEntry" ADD CONSTRAINT "ChatHistoryEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "dorapocket"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dorapocket"."PreferenceProfileOverride" ADD CONSTRAINT "PreferenceProfileOverride_userId_fkey" FOREIGN KEY ("userId") REFERENCES "dorapocket"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dorapocket"."RecommendationSession" ADD CONSTRAINT "RecommendationSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "dorapocket"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dorapocket"."RecommendationEvaluation" ADD CONSTRAINT "RecommendationEvaluation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "dorapocket"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dorapocket"."RecommendationEvaluation" ADD CONSTRAINT "RecommendationEvaluation_recommendationSessionId_fkey" FOREIGN KEY ("recommendationSessionId") REFERENCES "dorapocket"."RecommendationSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Closed catalog vocabulary; unknown/null are explicit values, never optimistic defaults.
ALTER TABLE dorapocket."Tool"
  ADD CONSTRAINT "Tool_url_http_check" CHECK ("url" ~* '^https?://[^[:space:]/?#]+([/?#][^[:space:]]*)?$'),
  ADD CONSTRAINT "Tool_status_check" CHECK ("status" IN ('active', 'inactive')),
  ADD CONSTRAINT "Tool_category_check" CHECK ("category" IN ('ai_assistant', 'search', 'developer', 'design', 'productivity', 'media', 'learning', 'writing', 'other')),
  ADD CONSTRAINT "Tool_pricingModel_check" CHECK ("pricingModel" IN ('free', 'freemium', 'paid', 'subscription', 'unknown')),
  ADD CONSTRAINT "Tool_platform_check" CHECK ("platform" IN ('web', 'desktop', 'mobile', 'api', 'mixed', 'unknown'));
ALTER TABLE dorapocket."MarketFeedback"
  ADD CONSTRAINT "MarketFeedback_vote_check" CHECK ("vote" IN ('up', 'down')),
  ADD CONSTRAINT "MarketFeedback_starRating_check" CHECK ("starRating" BETWEEN 1 AND 5);
ALTER TABLE dorapocket."RecommendationEvaluation"
  ADD CONSTRAINT "RecommendationEvaluation_rating_check" CHECK ("rating" IS NULL OR "rating" BETWEEN 1 AND 5);
ALTER TABLE dorapocket."ToolActivity"
  ADD CONSTRAINT "ToolActivity_nonnegative_check" CHECK ("saves" >= 0 AND "opens" >= 0);
ALTER TABLE dorapocket."PocketItem"
  ADD CONSTRAINT "PocketItem_useCount_check" CHECK ("useCount" >= 0);

CREATE INDEX "ToolIndex_searchDocument_idx" ON dorapocket."ToolIndex" USING gin ("searchDocument");
CREATE INDEX "Tool_status_createdAt_idx" ON dorapocket."Tool" ("status", "createdAt");
CREATE INDEX "Tool_createdByUserId_idx" ON dorapocket."Tool" ("createdByUserId");
DO $extension_indexes$
DECLARE vector_schema text; trigram_schema text;
BEGIN
  SELECT n.nspname INTO STRICT vector_schema FROM pg_catalog.pg_extension e JOIN pg_catalog.pg_namespace n ON n.oid = e.extnamespace WHERE e.extname = 'vector';
  SELECT n.nspname INTO STRICT trigram_schema FROM pg_catalog.pg_extension e JOIN pg_catalog.pg_namespace n ON n.oid = e.extnamespace WHERE e.extname = 'pg_trgm';
  EXECUTE pg_catalog.format('CREATE INDEX "ToolIndex_embedding_idx" ON dorapocket."ToolIndex" USING hnsw ("embedding" %I.vector_cosine_ops)', vector_schema);
  EXECUTE pg_catalog.format('CREATE INDEX "Tool_name_trgm_idx" ON dorapocket."Tool" USING gin ("name" %I.gin_trgm_ops)', trigram_schema);
END
$extension_indexes$;

-- Provision credentials separately. Runtime uses this isolated role, never the DDL owner.
DO $runtime_role$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = 'dorapocket_app') THEN
    CREATE ROLE dorapocket_app NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOREPLICATION NOBYPASSRLS;
  END IF;
END
$runtime_role$;
REVOKE ALL ON SCHEMA dorapocket FROM PUBLIC;
GRANT USAGE ON SCHEMA dorapocket TO dorapocket_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON dorapocket."User", dorapocket."UserSettings", dorapocket."Tool", dorapocket."ToolIndex", dorapocket."PocketItem", dorapocket."MarketFeedback", dorapocket."MarketSubmission", dorapocket."ToolActivity", dorapocket."ChatHistoryEntry", dorapocket."PreferenceProfileOverride", dorapocket."RecommendationSession", dorapocket."RecommendationEvaluation" TO dorapocket_app;
DO $extension_access$
DECLARE extension_schema text;
BEGIN
  FOR extension_schema IN SELECT DISTINCT n.nspname FROM pg_catalog.pg_extension e JOIN pg_catalog.pg_namespace n ON n.oid = e.extnamespace WHERE e.extname IN ('vector', 'pg_trgm') LOOP
    EXECUTE pg_catalog.format('GRANT USAGE ON SCHEMA %I TO dorapocket_app', extension_schema);
  END LOOP;
END
$extension_access$;

-- RLS also protects tables accidentally exposed through Data API configuration.
DO $runtime_policies$
DECLARE table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['User', 'UserSettings', 'Tool', 'ToolIndex', 'PocketItem', 'MarketFeedback', 'MarketSubmission', 'ToolActivity', 'ChatHistoryEntry', 'PreferenceProfileOverride', 'RecommendationSession', 'RecommendationEvaluation'] LOOP
    EXECUTE pg_catalog.format('ALTER TABLE dorapocket.%I ENABLE ROW LEVEL SECURITY', table_name);
    EXECUTE pg_catalog.format('CREATE POLICY runtime_crud ON dorapocket.%I FOR ALL TO dorapocket_app USING (true) WITH CHECK (true)', table_name);
  END LOOP;
END
$runtime_policies$;

-- This helper belongs only to DoraPocket. Never replace public helpers shared with other apps.
CREATE FUNCTION dorapocket.current_app_user_id() RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog
AS $function$
  SELECT u."id" FROM dorapocket."User" AS u WHERE u."supabaseUserId" = (auth.uid())::text LIMIT 1
$function$;
REVOKE ALL ON FUNCTION dorapocket.current_app_user_id() FROM PUBLIC;

-- Supabase-owned roles/publication are optional on plain PostgreSQL validation instances.
DO $client_access$
DECLARE table_name text;
BEGIN
  IF EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = 'authenticated') THEN
    GRANT USAGE ON SCHEMA dorapocket TO authenticated;
    GRANT EXECUTE ON FUNCTION dorapocket.current_app_user_id() TO authenticated;
    GRANT SELECT ON dorapocket."User" TO authenticated;
    CREATE POLICY select_own_user ON dorapocket."User" FOR SELECT TO authenticated USING ("id" = dorapocket.current_app_user_id());
    FOREACH table_name IN ARRAY ARRAY['UserSettings', 'PocketItem', 'MarketFeedback', 'MarketSubmission', 'ToolActivity', 'ChatHistoryEntry', 'PreferenceProfileOverride', 'RecommendationSession', 'RecommendationEvaluation'] LOOP
      EXECUTE pg_catalog.format('GRANT SELECT ON dorapocket.%I TO authenticated', table_name);
      EXECUTE pg_catalog.format('CREATE POLICY select_own_data ON dorapocket.%I FOR SELECT TO authenticated USING ("userId" = dorapocket.current_app_user_id())', table_name);
    END LOOP;
  END IF;
END
$client_access$;

DO $realtime$
DECLARE table_name text;
BEGIN
  IF EXISTS (SELECT 1 FROM pg_catalog.pg_publication WHERE pubname = 'supabase_realtime') THEN
    FOREACH table_name IN ARRAY ARRAY['PocketItem', 'UserSettings', 'ChatHistoryEntry', 'MarketSubmission', 'MarketFeedback'] LOOP
      IF NOT EXISTS (SELECT 1 FROM pg_catalog.pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'dorapocket' AND tablename = table_name) THEN
        EXECUTE pg_catalog.format('ALTER PUBLICATION supabase_realtime ADD TABLE dorapocket.%I', table_name);
      END IF;
    END LOOP;
  END IF;
END
$realtime$;

COMMIT;
