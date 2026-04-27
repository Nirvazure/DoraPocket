'use client'

import Link from 'next/link'
import { PageShell } from '@/components/common/page-shell'
import { ProfileEntryPill } from '@/components/common/profile-entry-pill'
import { TopNavSwitch } from '@/components/common/top-nav-switch'
import { UnifiedTopBar } from '@/components/common/unified-top-bar'
import { ProfilePreferencePanel } from '@/components/profile/profile-preference-panel'
import { ProfileTimelineSection } from '@/components/profile/profile-timeline-section'
import { Button } from '@/components/ui/button'
import { useProfilePageModel } from '@/hooks/use-profile-page-model'
import { useAuthSessionQuery } from '@/lib/query/auth-session'
import { useChatHistoryQuery } from '@/lib/query/chat-history'
import { useMarketActivityQuery } from '@/lib/query/market-activity'
import {
  useMarketContextQuery,
  useMarketFeedbackQuery,
  useMarketSubscriptionsQuery,
  usePreferenceProfileOverrideQuery,
  useResetPreferenceProfileOverrideMutation,
  useSavePreferenceProfileOverrideMutation,
} from '@/lib/query/market'
import { usePocketInventoryQuery } from '@/lib/query/pocket'
import {
  useSaveUserProfileMutation,
  useUserProfileQuery,
  useUserProfileSubscription,
} from '@/lib/query/user-profile'
import { getPreferenceCalibrationOptions } from '@/services/market-storage'
import { PAGE_COPY } from '@/shared/ui-copy'

export function ProfilePage() {
  const { data: authSession } = useAuthSessionQuery()
  const { data: history = [] } = useChatHistoryQuery()
  const { data: pocketInventory = [] } = usePocketInventoryQuery()
  const { data: feedback = [] } = useMarketFeedbackQuery()
  const { data: subscriptionRecords = [] } = useMarketSubscriptionsQuery()
  const { data: preferenceOverride } = usePreferenceProfileOverrideQuery()
  const { data: marketContext } = useMarketContextQuery()
  const { data: activities = [] } = useMarketActivityQuery(4)
  const savePreferenceProfileOverrideMutation = useSavePreferenceProfileOverrideMutation()
  const resetPreferenceProfileOverrideMutation = useResetPreferenceProfileOverrideMutation()
  useUserProfileSubscription()
  const { data: profile } = useUserProfileQuery()
  const saveUserProfileMutation = useSaveUserProfileMutation()
  const calibrationOptions = getPreferenceCalibrationOptions()

  const profileModel = useProfilePageModel({
    history,
    pocketInventory,
    feedback,
    subscriptionRecords,
    preferenceOverride,
    marketContext,
    activities,
    profile,
    savePreferenceProfileOverride: savePreferenceProfileOverrideMutation.mutate,
    resetPreferenceProfileOverride: () => resetPreferenceProfileOverrideMutation.mutate(),
    saveUserProfile: saveUserProfileMutation.mutateAsync,
  })

  return (
    <PageShell
      header={
        <UnifiedTopBar
          title={PAGE_COPY.profile.title}
          subtitle={PAGE_COPY.profile.subtitle}
          leftSlot={
            <Button
              asChild
              type="button"
              variant="outline"
              className="h-10 rounded-full bg-white/90 px-3 text-xs font-semibold sm:text-sm"
            >
              <Link href="/profile/settings">设置</Link>
            </Button>
          }
          rightSlot={
            <div className="flex items-center gap-2">
              <TopNavSwitch current="profile" />
              <ProfileEntryPill active />
            </div>
          }
        />
      }
    >
      {!authSession?.authenticated ? (
        <div className="mx-auto flex max-w-3xl flex-col gap-4 rounded-[2rem] border border-white/80 bg-white/92 p-8 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
            Profile Memory
          </p>
          <h2 className="text-3xl font-black tracking-tight text-foreground">
            登录后，这里才会开始积累你的偏好与资产。
          </h2>
          <p className="text-sm leading-7 text-muted-foreground">
            个人中心会汇总你的口袋资产、市场反馈、推荐历史和偏好校准。当前未登录状态下，这些都不会进入云端记忆。
          </p>
          <div className="flex gap-3">
            <Button asChild className="h-10 rounded-full px-4 text-sm font-bold">
              <Link href="/login">立即登录</Link>
            </Button>
            <Button asChild variant="outline" className="h-10 rounded-full px-4 text-sm font-bold">
              <Link href="/analyse">返回分析页</Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.55fr)_minmax(17.5rem,0.78fr)] xl:grid-cols-[minmax(0,1.68fr)_minmax(19rem,0.72fr)]">
          <ProfileTimelineSection
            feedbackCount={profileModel.feedbackCount}
            subscriptionCount={profileModel.subscriptionCount}
            archivedCount={profileModel.archivedCount}
            activities={profileModel.activities}
            history={profileModel.history}
            formatTime={profileModel.formatTime}
          />

          <ProfilePreferencePanel
            fileInputRef={profileModel.fileInputRef}
            onPickAvatar={profileModel.handlePickAvatar}
            onReset={profileModel.resetPreferenceProfileOverride}
            calibrationCount={profileModel.calibrationCount}
            profileAvatarSrc={profileModel.profileAvatarSrc}
            profileNickname={profileModel.profileNickname}
            profileSummary={profileModel.profileSummary}
            profileFacts={profileModel.profileFacts}
            calibrationOptions={calibrationOptions}
            preferenceOverride={profileModel.preferenceOverride}
            preferenceLabel={profileModel.preferenceLabel}
            onToggleListValue={profileModel.toggleListValue}
            onSetBooleanPreference={profileModel.setBooleanPreference}
          />
        </div>
      )}
    </PageShell>
  )
}
