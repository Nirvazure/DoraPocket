'use client'

import { PageShell } from '@/components/common/page-shell'
import { ProfileEntryPill } from '@/components/common/profile-entry-pill'
import { TopNavSwitch } from '@/components/common/top-nav-switch'
import { UnifiedTopBar } from '@/components/common/unified-top-bar'
import { ProfilePreferencePanel } from '@/components/profile/profile-preference-panel'
import { ProfileTimelineSection } from '@/components/profile/profile-timeline-section'
import { useProfilePageModel } from '@/hooks/use-profile-page-model'
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
          rightSlot={
            <div className="flex items-center gap-2">
              <TopNavSwitch current="profile" />
              <ProfileEntryPill active />
            </div>
          }
        />
      }
    >
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
    </PageShell>
  )
}
