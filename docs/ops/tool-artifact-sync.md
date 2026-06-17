# Tool Artifact Sync Acceptance

This document validates the server-side chain that keeps imported tool artifacts up to date. The current chain uses Supabase Database Webhook for near-real-time events and Vercel Cron as a fallback.

## Acceptance Levels

### Level 1: Non-Destructive Chain Acceptance

This level verifies route wiring and orchestration without forcing external artifact writes.

It covers:

- Webhook route auth, JSON parsing, payload dispatch, and response shape.
- Cron route auth, job orchestration, and response shape.
- Handler-level decisions for whether a tool should be synchronized.
- Unit-level coverage for pending tool selection and sync result accounting.

This level does not prove that Qwen embedding generation, favicon download, Supabase Storage upload, and database artifact fields all changed in one end-to-end run.

### Level 2: End-to-End Artifact Acceptance

This level verifies real artifact generation. It requires a temporary Tool record or another explicitly safe test record.

It covers:

- A Tool with `status = active`, a valid `url`, missing `iconImageUrl`, and missing `embeddedAt`.
- Webhook or Cron triggering `syncToolArtifacts`.
- Favicon fetch and upload through Supabase Storage.
- Qwen embedding generation.
- Database writes to `iconType`, `iconImageUrl`, `embeddingModel`, `embeddingContentHash`, and `embeddedAt`.
- Cleanup or restoration of the temporary test data.

Do not run this level against production-like real tools unless the record is explicitly safe to mutate.

## Prerequisites

- Local service is running with `yarn dev`.
- `DATABASE_URL` is configured.
- `CRON_SECRET` is configured.
- `QWEN_API_KEY` is configured.
- `NEXT_PUBLIC_SUPABASE_URL` is configured.
- Supabase Storage server-side variables are configured so `uploadMarketAsset` can upload market assets.

## Test Command

Server modules use the `server-only` marker package. Run direct Node tests with the `react-server` condition:

```bash
yarn tsx --conditions react-server --test src/server/webhooks/verify-supabase-webhook.test.ts src/server/cron/verify-cron-request.test.ts src/server/cron/sync-pending-tools.test.ts src/server/cron/sync-tool-artifacts.test.ts
```

## Supabase Webhook Configuration

- URL: `https://<your-domain>/api/webhooks/supabase`
- Header: `Authorization: Bearer <CRON_SECRET>`
- Table: `Tool`
- Events: `INSERT`, `UPDATE`
- Table: `MarketSubmission`
- Event: `INSERT`

Webhook responsibilities:

- `Tool` `INSERT` / `UPDATE`: call `syncToolArtifacts` when artifact sync is needed.
- `MarketSubmission` `INSERT`: call submission deduplication when the submission is in review.
- Non-`public` schema, invalid records, and records that do not need sync should be skipped.

## Vercel Cron Configuration

Configuration source: `vercel.json`

Current schedule:

```json
{
  "path": "/api/cron/process-jobs",
  "schedule": "0 3 * * *"
}
```

Cron responsibilities:

- Batch-sync active tools that are missing embedding or favicon artifacts.
- Batch-process pending submission deduplication.
- Refresh tool rating aggregates.
- Clean up expired RecommendationSession records.

## Manual Webhook Check

Replace `<CRON_SECRET>` and `<toolId>` with local values.

```bash
curl -X POST "http://localhost:3000/api/webhooks/supabase" \
  -H "Authorization: Bearer <CRON_SECRET>" \
  -H "Content-Type: application/json" \
  -d "{\"type\":\"INSERT\",\"table\":\"Tool\",\"schema\":\"public\",\"record\":{\"id\":\"<toolId>\",\"status\":\"active\",\"url\":\"https://example.com\",\"iconImageUrl\":null,\"embeddedAt\":null},\"old_record\":null}"
```

Expected Level 1 result:

- HTTP 200.
- Response JSON contains `"ok": true`.
- `action` is `tool-sync`.
- `outcome` is `synced` or `noop`.

Unauthorized check:

```bash
curl -X POST "http://localhost:3000/api/webhooks/supabase" \
  -H "Authorization: Bearer wrong" \
  -H "Content-Type: application/json" \
  -d "{\"type\":\"INSERT\",\"table\":\"Tool\",\"schema\":\"public\",\"record\":{\"id\":\"<toolId>\"},\"old_record\":null}"
```

Expected result: HTTP 401.

## Manual Cron Check

```bash
curl "http://localhost:3000/api/cron/process-jobs" \
  -H "Authorization: Bearer <CRON_SECRET>"
```

Expected Level 1 result:

- HTTP 200.
- Response JSON contains `"ok": true`.
- Response includes `sync`, `dedup`, `ratings`, and `sessions`.

Unauthorized check:

```bash
curl "http://localhost:3000/api/cron/process-jobs" \
  -H "Authorization: Bearer wrong"
```

Expected result: HTTP 401.

## Database Field Checks

For Level 2 acceptance, inspect the target `Tool`:

- `iconType`: should be `favicon` after favicon sync succeeds.
- `iconImageUrl`: should be a Supabase Storage public URL after favicon sync succeeds.
- `marketAssetOrigin`: if the upload chain sets an origin, it should match the market asset convention.
- `embeddingModel`: should be set after embedding sync succeeds.
- `embeddingContentHash`: should be set after embedding sync succeeds.
- `embeddedAt`: should be set after embedding sync succeeds.

## Success Criteria

Level 1 succeeds when:

- Webhook accepts a valid authorized request and rejects an invalid token.
- Cron accepts a valid authorized request and rejects an invalid token.
- Server tests cover auth, pending tool selection, sync result accounting, and missing-tool no-op behavior.
- `yarn typecheck` passes.
- `yarn lint` has no errors.

Level 2 succeeds when:

- A safe active Tool with a URL and missing artifacts completes favicon and embedding sync through Webhook or Cron.
- The expected database artifact fields are updated.
- Temporary test data is cleaned up or restored.

## Current Acceptance Record

This run completed Level 1 only.

- Webhook authorized check: HTTP 200, `action = tool-sync`, `outcome = noop`.
- Cron authorized check: HTTP 200, response included `sync`, `dedup`, `ratings`, and `sessions`.
- Webhook unauthorized check: HTTP 401.
- Cron unauthorized check: HTTP 401.
- Server tests: 12/12 passed.
- `yarn typecheck`: passed.
- `yarn lint`: 0 errors, 3 existing warnings outside this change.

Level 2 was not executed in this run because it would require mutating a temporary or explicitly safe Tool record and allowing external Qwen, favicon, Supabase Storage, and database writes.

## Failure Record Template

If manual acceptance fails, record:

- Trigger path: Webhook or Cron.
- Acceptance level: Level 1 or Level 2.
- HTTP status code.
- Response JSON.
- Target `Tool.id`.
- Target `Tool.url`.
- Database field values before and after the run.
- Server log entries for `[syncPendingTools]` or `[syncToolEmbedding]`.
