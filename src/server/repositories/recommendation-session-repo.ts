import 'server-only'

import { prisma } from '@/server/db/prisma'
import type { AgentUiPayload } from '@/shared/market-types'

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
