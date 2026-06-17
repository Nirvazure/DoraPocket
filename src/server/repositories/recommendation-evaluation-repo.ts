import 'server-only'

import { prisma } from '@/server/db/prisma'
import type { RecommendationEvaluationInput } from '@/shared/recommendation-evaluation'

export async function listRecommendationEvaluations(userId: string) {
  return prisma.recommendationEvaluation.findMany({
    where: { userId },
    select: {
      selectedToolId: true,
      helpful: true,
      rating: true,
    },
  })
}

export async function saveRecommendationEvaluation(
  userId: string,
  input: RecommendationEvaluationInput,
) {
  const evaluation = await prisma.recommendationEvaluation.upsert({
    where: {
      userId_recommendationSessionId: {
        userId,
        recommendationSessionId: input.recommendationSessionId,
      },
    },
    create: {
      userId,
      recommendationSessionId: input.recommendationSessionId,
      selectedToolId: input.selectedToolId ?? null,
      opened: input.opened ?? false,
      saved: input.saved ?? false,
      tried: input.tried ?? false,
      helpful: input.helpful ?? null,
      outcome: input.outcome ?? null,
      rating: input.rating ?? null,
      tags: input.tags ?? [],
      comment: input.comment ?? null,
    },
    update: {
      selectedToolId: input.selectedToolId ?? null,
      opened: input.opened ?? false,
      saved: input.saved ?? false,
      tried: input.tried ?? false,
      helpful: input.helpful ?? null,
      outcome: input.outcome ?? null,
      rating: input.rating ?? null,
      tags: input.tags ?? [],
      comment: input.comment ?? null,
    },
  })

  await prisma.recommendationSession.update({
    where: { id: input.recommendationSessionId },
    data: { evaluatedAt: new Date() },
  })

  return evaluation
}
