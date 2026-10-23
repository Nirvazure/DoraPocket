import 'server-only'

import type { MarketContext } from '@/shared/market/market-types'
import { createEmptyMarketContext } from '@/shared/market/market-defaults'
import { listMarketFeedback } from '@/server/repositories/market-feedback-repo'
import { listPocketItems } from '@/server/repositories/pocket-repo'
import { getPreferenceProfileOverride } from '@/server/repositories/preference-repo'
import { getToolActivityMap } from '@/server/repositories/tool-activity-repo'
import { listActiveTools } from '@/server/repositories/tool-repo'
import { listRecommendationEvaluations } from '@/server/repositories/recommendation-evaluation-repo'
import {
  applyPreferenceOverride,
  inferUserPreferenceProfile,
} from '@/server/market/preference-profile'

export async function buildMarketContextForUser(
  userId: string,
  mode: 'applied' | 'inferred' = 'applied',
): Promise<MarketContext> {
  const [pocketInventory, feedback, activityMap, override, tools, recommendationEvaluations] =
    await Promise.all([
      listPocketItems(userId),
      listMarketFeedback(userId),
      getToolActivityMap(userId),
      getPreferenceProfileOverride(userId),
      listActiveTools(),
      listRecommendationEvaluations(userId),
    ])

  const inferred = inferUserPreferenceProfile({
    pocketInventory,
    feedback,
    activityMap,
    tools,
    recommendationEvaluations,
  })

  return {
    savedItems: pocketInventory.map((item: { toolId: string; sourceQuestion?: string }) => ({
      toolId: item.toolId,
      sourceQuestion: item.sourceQuestion,
    })),
    feedback,
    preferenceProfile: mode === 'applied' ? applyPreferenceOverride(inferred, override) : inferred,
  }
}

export function buildEmptyMarketContext() {
  return createEmptyMarketContext()
}
