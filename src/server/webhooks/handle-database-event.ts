import 'server-only'

import { syncToolArtifacts, toolRecordNeedsArtifactSync } from '@/server/market/sync-tool-artifacts'

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
    status: asString(record.status) ?? 'inactive',
    url: asString(record.url),
    iconUrl: asString(record.iconUrl),
    name: asString(record.name) ?? undefined,
    description: asString(record.description) ?? undefined,
    category: asString(record.category) ?? undefined,
    tags: Array.isArray(record.tags) ? (record.tags as string[]) : undefined,
  }
}

export type DatabaseWebhookResult = {
  handled: boolean
  action?: string
  outcome?: string
}

export async function handleDatabaseWebhookEvent(
  payload: DatabaseWebhookPayload,
  deps: { syncArtifacts: typeof syncToolArtifacts } = { syncArtifacts: syncToolArtifacts },
): Promise<DatabaseWebhookResult> {
  if (payload.schema !== 'dorapocket') return { handled: false }

  if (payload.table === 'Tool' && (payload.type === 'INSERT' || payload.type === 'UPDATE')) {
    const record = parseToolRecord(payload.record)
    if (!record) return { handled: false }
    const oldRecord = parseToolRecord(payload.old_record)
    if (!toolRecordNeedsArtifactSync(payload.type, record, oldRecord)) {
      return { handled: true, action: 'tool-sync', outcome: 'skipped' }
    }

    const result = await deps.syncArtifacts(record.id)
    return {
      handled: true,
      action: 'tool-sync',
      outcome: result.embeddingSynced || result.faviconSynced ? 'synced' : 'noop',
    }
  }

  return { handled: false }
}
