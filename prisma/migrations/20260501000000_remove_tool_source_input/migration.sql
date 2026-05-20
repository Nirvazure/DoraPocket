-- Remove the deferred source-import system. User-submitted tools remain supported.
DELETE FROM "Tool"
WHERE "source" = 'imported'
   OR "marketAssetOrigin" = 'source_import'
   OR "seedSource" = 'source_import';

ALTER TABLE "Tool" DROP CONSTRAINT IF EXISTS "Tool_ingestSourceInputId_fkey";

ALTER TABLE "Tool" DROP COLUMN IF EXISTS "ingestSourceInputId";
ALTER TABLE "Tool" DROP COLUMN IF EXISTS "ingestConfidence";
ALTER TABLE "Tool" DROP COLUMN IF EXISTS "ingestReason";
ALTER TABLE "Tool" DROP COLUMN IF EXISTS "firstSeenAt";

DROP TABLE IF EXISTS "ToolSourceInput";
