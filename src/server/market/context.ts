import 'server-only'

import type { MarketContext } from '@/shared/market-types'
import { createEmptyMarketContext } from '@/shared/market-defaults'
import { listMarketFeedback } from '@/server/repositories/market-feedback-repo'
import { listMarketSubmissions } from '@/server/repositories/market-submission-repo'
import { listMarketSubscriptions } from '@/server/repositories/market-subscription-repo'
import { listPocketItems } from '@/server/repositories/pocket-repo'
import { getPreferenceProfileOverride } from '@/server/repositories/preference-repo'
import { getToolActivityMap } from '@/server/repositories/tool-activity-repo'
import { listActiveTools } from '@/server/repositories/tool-repo'
import {
  applyPreferenceOverride,
  inferUserPreferenceProfile,
} from '@/server/market/preference-profile'

export async function buildMarketContextForUser(
  userId: string,
  mode: 'applied' | 'inferred' = 'applied',
): Promise<MarketContext> {
  const [pocketInventory, feedback, subscriptions, submissions, activityMap, override, tools] =
    await Promise.all([
      listPocketItems(userId),
      listMarketFeedback(userId),
      listMarketSubscriptions(userId),
      listMarketSubmissions(userId),
      getToolActivityMap(userId),
      getPreferenceProfileOverride(userId),
      listActiveTools(),
    ])

  const inferred = inferUserPreferenceProfile({
    pocketInventory,
    feedback,
    subscriptions,
    activityMap,
    tools,
  })

  return {
    savedItems: pocketInventory.map(
      (item: {
        toolId: string
        presetArgs?: Record<string, unknown>
        sourceQuestion?: string
      }) => ({
        toolId: item.toolId,
        presetArgs: item.presetArgs,
        sourceQuestion: item.sourceQuestion,
      }),
    ),
    feedback,
    subscriptions: subscriptions.filter((item: { active: boolean }) => item.active),
    submissions,
    preferenceProfile: mode === 'applied' ? applyPreferenceOverride(inferred, override) : inferred,
  }
}

export function buildEmptyMarketContext() {
  return createEmptyMarketContext()
}
