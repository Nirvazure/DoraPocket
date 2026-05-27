import { NextResponse } from 'next/server'
import {
  cleanupExpiredRecommendationSessions,
  refreshToolRatingAggregates,
} from '@/server/cron/maintenance-jobs'
import { syncPendingTools } from '@/server/cron/sync-pending-tools'
import { verifyCronRequest } from '@/server/cron/verify-cron-request'
import { dedupPendingSubmissions } from '@/server/market/submission-dedup'

export const runtime = 'nodejs'
export const maxDuration = 60

function readBatchSize(key: string, fallback: number): number {
  const raw = process.env[key]?.trim()
  if (!raw) return fallback
  const parsed = Number(raw)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

export async function GET(request: Request) {
  if (!verifyCronRequest(request)) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const sync = await syncPendingTools(readBatchSize('CRON_SYNC_BATCH_SIZE', 10))
  const dedup = await dedupPendingSubmissions(readBatchSize('CRON_DEDUP_BATCH_SIZE', 20))
  const ratings = await refreshToolRatingAggregates()
  const sessions = await cleanupExpiredRecommendationSessions()

  return NextResponse.json({ ok: true, sync, dedup, ratings, sessions })
}
