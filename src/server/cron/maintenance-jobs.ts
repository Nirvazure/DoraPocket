import 'server-only'

import { SESSION_RETENTION_DAYS } from '@/constant'
import { prisma } from '@/server/db/prisma'
export type CleanupRecommendationSessionsResult = {
  deleted: number
  retentionDays: number
}

export async function cleanupExpiredRecommendationSessions(): Promise<CleanupRecommendationSessionsResult> {
  const retentionDays = SESSION_RETENTION_DAYS
  const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000)
  const deleted = await prisma.recommendationSession.deleteMany({
    where: { createdAt: { lt: cutoff } },
  })

  return { deleted: deleted.count, retentionDays }
}
