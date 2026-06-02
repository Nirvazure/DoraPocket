DELETE FROM "Tool"
WHERE "source" = 'builtin'
   OR "isBuiltin" = true
   OR id LIKE 'builtin_%'
   OR id IN ('weather', 'time', 'exchange_rate', 'air_quality', 'web_summary');

ALTER TABLE "UserSettings" DROP COLUMN IF EXISTS "builtinToolsEnabled";

ALTER TABLE "Tool" DROP COLUMN IF EXISTS "isBuiltin";

ALTER TABLE "DataMigrationState" DROP COLUMN IF EXISTS "toolSeedImportedAt";
