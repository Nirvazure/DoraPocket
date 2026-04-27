'use client'

import { useRef, type ChangeEvent } from 'react'
import type { ChatHistoryEntry } from '@/services/chat-history'
import type { PocketInventoryItem } from '@/services/pocket-inventory'
import type { UserProfile } from '@/services/user-profile'
import { DEFAULT_USER_AVATAR_SRC, DEFAULT_USER_NICKNAME } from '@/services/user-profile'
import { createEmptyMarketContext } from '@/shared/market-defaults'
import type {
  MarketContext,
  MarketFeedbackRecord,
  MarketSubscriptionRecord,
  PreferenceProfileOverride,
} from '@/shared/market-types'
import type { ToolCategory, ToolExecutionMode, ToolPricingModel } from '@/shared/tool-registry'
import { TOOL_PREFERENCE_LABELS } from '@/shared/tool-labels'
import { PROFILE_COPY } from '@/shared/ui-copy'

function formatTime(value: number) {
  return new Date(value).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function preferenceLabel(value: string) {
  return TOOL_PREFERENCE_LABELS[value as keyof typeof TOOL_PREFERENCE_LABELS] ?? value
}

function buildProfileFacts(marketContext: MarketContext, subscriptionsCount: number) {
  return [
    {
      label: PROFILE_COPY.factLabels.preferredCategory,
      value:
        marketContext.preferenceProfile.preferredCategories
          .slice(0, 3)
          .map(preferenceLabel)
          .join(' / ') || PROFILE_COPY.factLabels.pending,
    },
    {
      label: PROFILE_COPY.factLabels.preferredPlatform,
      value:
        marketContext.preferenceProfile.preferredPlatforms.slice(0, 2).join(' / ') ||
        PROFILE_COPY.factLabels.pending,
    },
    {
      label: PROFILE_COPY.factLabels.preferredPricing,
      value:
        marketContext.preferenceProfile.preferredPricing
          .slice(0, 3)
          .map(preferenceLabel)
          .join(' / ') || PROFILE_COPY.factLabels.pending,
    },
    {
      label: PROFILE_COPY.factLabels.subscribedAssets,
      value: `${subscriptionsCount} 个`,
    },
  ]
}

function countCalibrationSelections(override: PreferenceProfileOverride) {
  return (
    (override.preferredCategories?.length ?? 0) +
    (override.preferredPricing?.length ?? 0) +
    (override.preferredExecutionModes?.length ?? 0) +
    Number(override.avoidAuthWall === true) +
    Number(override.prefersSubscriptionTools === true)
  )
}

type UseProfilePageModelOptions = {
  history: ChatHistoryEntry[]
  pocketInventory: PocketInventoryItem[]
  feedback: MarketFeedbackRecord[]
  subscriptionRecords: MarketSubscriptionRecord[]
  preferenceOverride?: PreferenceProfileOverride
  marketContext?: MarketContext
  activities: Array<{
    id: string
    title: string
    detail: string
    createdAt: number
  }>
  profile?: UserProfile
  savePreferenceProfileOverride: (value: PreferenceProfileOverride) => void
  resetPreferenceProfileOverride: () => void
  saveUserProfile: (value: UserProfile) => Promise<unknown>
}

export function useProfilePageModel({
  history,
  pocketInventory,
  feedback,
  subscriptionRecords,
  preferenceOverride,
  marketContext,
  activities,
  profile,
  savePreferenceProfileOverride,
  resetPreferenceProfileOverride,
  saveUserProfile,
}: UseProfilePageModelOptions) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const subscriptions = subscriptionRecords.filter((item) => item.active)
  const archivedCount = pocketInventory.filter((item) => item.archived).length
  const resolvedMarketContext = marketContext ?? createEmptyMarketContext()
  const resolvedPreferenceOverride: PreferenceProfileOverride = preferenceOverride ?? {}
  const visibleHistory = history.slice(0, 5)
  const visibleActivities = activities.slice(0, 4)
  const profileSummary =
    resolvedMarketContext.preferenceProfile.summary.length > 0
      ? resolvedMarketContext.preferenceProfile.summary
      : [PROFILE_COPY.summaryFallback]
  const profileFacts = buildProfileFacts(resolvedMarketContext, subscriptions.length)

  // 偏好校准最终仍写回统一 override，对外保持单一来源。
  const commitPreferenceOverride = (next: PreferenceProfileOverride) => {
    savePreferenceProfileOverride(next)
  }

  const toggleListValue = (
    key: 'preferredCategories' | 'preferredPricing' | 'preferredExecutionModes',
    value: ToolCategory | ToolPricingModel | ToolExecutionMode,
  ) => {
    const list = (resolvedPreferenceOverride[key] ?? []) as Array<
      ToolCategory | ToolPricingModel | ToolExecutionMode
    >
    const nextList = list.includes(value) ? list.filter((item) => item !== value) : [...list, value]
    commitPreferenceOverride({ ...resolvedPreferenceOverride, [key]: nextList })
  }

  const setBooleanPreference = (
    key: 'avoidAuthWall' | 'prefersSubscriptionTools',
    value: boolean,
  ) => {
    commitPreferenceOverride({ ...resolvedPreferenceOverride, [key]: value })
  }

  const calibrationCount = countCalibrationSelections(resolvedPreferenceOverride)

  const handlePickAvatar = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      const formData = new FormData()
      formData.append('file', file)
      const response = await fetch('/api/me/avatar', {
        method: 'POST',
        body: formData,
      })
      if (!response.ok) {
        throw new Error('Avatar upload failed')
      }
      const { url: avatarSrc } = (await response.json()) as { url: string }
      await saveUserProfile({
        nickname: profile?.nickname ?? DEFAULT_USER_NICKNAME,
        avatarSrc,
      })
    } catch {
      // ignore
    } finally {
      event.target.value = ''
    }
  }

  return {
    fileInputRef,
    profileAvatarSrc: profile?.avatarSrc ?? DEFAULT_USER_AVATAR_SRC,
    profileNickname: profile?.nickname ?? DEFAULT_USER_NICKNAME,
    feedbackCount: feedback.length,
    subscriptionCount: subscriptions.length,
    archivedCount,
    activities: visibleActivities,
    history: visibleHistory,
    formatTime,
    calibrationCount,
    profileSummary,
    profileFacts,
    preferenceOverride: resolvedPreferenceOverride,
    preferenceLabel,
    toggleListValue,
    setBooleanPreference,
    handlePickAvatar,
    resetPreferenceProfileOverride,
  }
}
