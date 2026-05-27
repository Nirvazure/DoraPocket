import 'server-only'

import { prisma } from '@/server/db/prisma'
import type { ToolRatingSummary } from '@/shared/tool-registry'

export type RefreshToolRatingsResult = {
  updated: number
}

function readRetentionDays(): number {
  const raw = process.env.SESSION_RETENTION_DAYS?.trim()
  if (!raw) return 90
  const parsed = Number(raw)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 90
}

function buildRatingSummary(
  feedback: Array<{ toolId: string; vote: string }>,
): Map<string, ToolRatingSummary> {
  const byTool = new Map<string, ToolRatingSummary>()

  for (const item of feedback) {
    const current = byTool.get(item.toolId) ?? { upvotes: 0, downvotes: 0, score: 0 }
    if (item.vote === 'up') current.upvotes += 1
    else current.downvotes += 1
    current.score = current.upvotes - current.downvotes
    byTool.set(item.toolId, current)
  }

  return byTool
}

function readStoredTrustSignals(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? { ...(value as Record<string, unknown>) }
    : {}
}

export async function refreshToolRatingAggregates(): Promise<RefreshToolRatingsResult> {
  const feedback = await prisma.marketFeedback.findMany({
    select: { toolId: true, vote: true },
  })
  const ratings = buildRatingSummary(feedback)
  const toolIds = [...ratings.keys()]

  if (toolIds.length === 0) {
    return { updated: 0 }
  }

  const tools = await prisma.tool.findMany({
    where: { id: { in: toolIds } },
    select: { id: true, trustSignals: true },
  })

  let updated = 0
  for (const tool of tools) {
    const ratingSummary = ratings.get(tool.id) ?? { upvotes: 0, downvotes: 0, score: 0 }
    const trustSignals = readStoredTrustSignals(tool.trustSignals)
    const previous = trustSignals.ratingSummary
    const unchanged =
      previous &&
      typeof previous === 'object' &&
      !Array.isArray(previous) &&
      (previous as ToolRatingSummary).upvotes === ratingSummary.upvotes &&
      (previous as ToolRatingSummary).downvotes === ratingSummary.downvotes &&
      (previous as ToolRatingSummary).score === ratingSummary.score

    if (unchanged) continue

    await prisma.tool.update({
      where: { id: tool.id },
      data: {
        trustSignals: {
          ...trustSignals,
          ratingSummary,
        },
      },
    })
    updated += 1
  }

  return { updated }
}

export type CleanupRecommendationSessionsResult = {
  deleted: number
  retentionDays: number
}

export async function cleanupExpiredRecommendationSessions(): Promise<CleanupRecommendationSessionsResult> {
  const retentionDays = readRetentionDays()
  const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000)
  const deleted = await prisma.recommendationSession.deleteMany({
    where: { createdAt: { lt: cutoff } },
  })

  return { deleted: deleted.count, retentionDays }
}
