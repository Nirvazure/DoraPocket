import { NextResponse } from 'next/server'
import { CRON_DEDUP_BATCH_SIZE, CRON_SYNC_BATCH_SIZE } from '@/constant'
import {
  cleanupExpiredRecommendationSessions,
  refreshToolRatingAggregates,
} from '@/server/cron/maintenance-jobs'
import { syncPendingTools } from '@/server/cron/sync-pending-tools'
import { verifyCronRequest } from '@/server/cron/verify-cron-request'
import { dedupPendingSubmissions } from '@/server/market/submission-dedup'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function GET(request: Request) {
  if (!verifyCronRequest(request)) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const sync = await syncPendingTools(CRON_SYNC_BATCH_SIZE)
  const dedup = await dedupPendingSubmissions(CRON_DEDUP_BATCH_SIZE)
  const ratings = await refreshToolRatingAggregates()
  const sessions = await cleanupExpiredRecommendationSessions()

  return NextResponse.json({ ok: true, sync, dedup, ratings, sessions })
}
