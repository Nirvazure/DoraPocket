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
    },
  })
}
