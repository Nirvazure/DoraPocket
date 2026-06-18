import 'server-only'

import { prisma } from '@/server/db/prisma'
import type { AgentUiPayload } from '@/shared/market-types'
import type { RecommendationHistoryItem } from '@/shared/profile-memory'

function toRecommendationHistoryItem(item: {
  id: string
  createdAt: Date
  userText: string
  finalText: string
  selectedToolId: string | null
  taskFrame: unknown
  candidates: unknown
  selectionReason: string
  selectionSignals: string[]
  preferenceSignals: string[]
  starterPath: string | null
  clarifyTurnCount: number
  confidenceLevel: string | null
  openedToolId: string | null
  savedToolId: string | null
  evaluatedAt: Date | null
}): RecommendationHistoryItem {
  return {
    id: item.id,
    createdAt: item.createdAt.getTime(),
    userText: item.userText,
    finalText: item.finalText,
    selectedToolId: item.selectedToolId,
    taskFrame: item.taskFrame as RecommendationHistoryItem['taskFrame'],
    candidates: item.candidates as RecommendationHistoryItem['candidates'],
    selectionReason: item.selectionReason,
    selectionSignals: item.selectionSignals,
    preferenceSignals: item.preferenceSignals,
    starterPath: item.starterPath,
    clarifyTurnCount: item.clarifyTurnCount,
    confidenceLevel:
      item.confidenceLevel === 'low' || item.confidenceLevel === 'normal'
        ? item.confidenceLevel
        : null,
    openedToolId: item.openedToolId,
    savedToolId: item.savedToolId,
    evaluatedAt: item.evaluatedAt?.getTime() ?? null,
  }
}

export async function listRecommendationSessions(userId: string) {
  const list = await prisma.recommendationSession.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })
  return list.map(toRecommendationHistoryItem)
}

export async function createRecommendationSession(
  userId: string,
  input: {
    userText: string
    finalText: string
    selectedToolId?: string | null
    uiPayload: AgentUiPayload
    starterPath?: string | null
    clarifyTurnCount?: number
    confidenceLevel?: 'normal' | 'low' | null
  },
) {
  return prisma.recommendationSession.create({
    data: {
      userId,
      userText: input.userText,
      finalText: input.finalText,
      selectedToolId: input.selectedToolId ?? null,
      taskFrame: input.uiPayload.taskFrame,
      candidates: input.uiPayload.candidates,
      selectionReason: input.uiPayload.selectionReason,
      selectionSignals: input.uiPayload.selectionSignals,
      preferenceSignals: input.uiPayload.preferenceSignals,
      starterPath: input.starterPath ?? null,
      clarifyTurnCount: input.clarifyTurnCount ?? 0,
      confidenceLevel: input.confidenceLevel ?? input.uiPayload.confidenceLevel ?? null,
    },
  })
}

export async function markRecommendationSessionOpened(
  userId: string,
  input: { recommendationSessionId: string; toolId: string },
) {
  return prisma.recommendationSession.updateMany({
    where: { id: input.recommendationSessionId, userId },
    data: { openedToolId: input.toolId },
  })
}

export async function markRecommendationSessionSaved(
  userId: string,
  input: { recommendationSessionId: string; toolId: string },
) {
  return prisma.recommendationSession.updateMany({
    where: { id: input.recommendationSessionId, userId },
    data: { savedToolId: input.toolId },
  })
}
