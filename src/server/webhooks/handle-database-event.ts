import 'server-only'

import { syncToolArtifacts, toolRecordNeedsArtifactSync } from '@/server/cron/sync-tool-artifacts'
import { dedupMarketSubmission } from '@/server/market/submission-dedup'

type DatabaseWebhookPayload = {
  type: 'INSERT' | 'UPDATE' | 'DELETE'
  table: string
  schema: string
  record: Record<string, unknown> | null
  old_record: Record<string, unknown> | null
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function parseToolRecord(record: Record<string, unknown> | null) {
  if (!record || typeof record.id !== 'string') return null
  return {
    id: record.id,
    status: asString(record.status) ?? 'active',
    url: asString(record.url),
    iconImageUrl: asString(record.iconImageUrl),
    embeddedAt: asString(record.embeddedAt),
    name: asString(record.name) ?? undefined,
    description: asString(record.description) ?? undefined,
    category: asString(record.category) ?? undefined,
    tags: Array.isArray(record.tags) ? (record.tags as string[]) : undefined,
    capabilities: Array.isArray(record.capabilities)
      ? (record.capabilities as string[])
      : undefined,
    recommendedFor: Array.isArray(record.recommendedFor)
      ? (record.recommendedFor as string[])
      : undefined,
  }
}

function parseSubmissionRecord(record: Record<string, unknown> | null) {
  if (!record || typeof record.id !== 'string') return null
  return {
    id: record.id,
    status: asString(record.status) ?? 'review',
  }
}

export type DatabaseWebhookResult = {
  handled: boolean
  action?: string
  outcome?: string
  error?: string
}

export async function handleDatabaseWebhookEvent(
  payload: DatabaseWebhookPayload,
): Promise<DatabaseWebhookResult> {
  if (payload.schema !== 'public') return { handled: false }

  if (payload.table === 'Tool' && (payload.type === 'INSERT' || payload.type === 'UPDATE')) {
    const record = parseToolRecord(payload.record)
    if (!record) return { handled: false }
    const oldRecord = parseToolRecord(payload.old_record)
    if (!toolRecordNeedsArtifactSync(payload.type, record, oldRecord)) {
      return { handled: true, action: 'tool-sync', outcome: 'skipped' }
    }

    try {
      const result = await syncToolArtifacts(record.id)
      return {
        handled: true,
        action: 'tool-sync',
        outcome: result.embeddingSynced || result.faviconSynced ? 'synced' : 'noop',
      }
    } catch (error) {
      return {
        handled: true,
        action: 'tool-sync',
        error: error instanceof Error ? error.message : 'tool sync failed',
      }
    }
  }

  if (payload.table === 'MarketSubmission' && payload.type === 'INSERT') {
    const record = parseSubmissionRecord(payload.record)
    if (!record || record.status !== 'review') {
      return { handled: true, action: 'submission-dedup', outcome: 'skipped' }
    }

    try {
      const outcome = await dedupMarketSubmission(record.id)
      return { handled: true, action: 'submission-dedup', outcome }
    } catch (error) {
      return {
        handled: true,
        action: 'submission-dedup',
        error: error instanceof Error ? error.message : 'dedup failed',
      }
    }
  }

  return { handled: false }
}
