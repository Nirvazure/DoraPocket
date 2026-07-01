'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { LoginEntryButton } from '@/components/auth/login-entry-button'
import { PageShell } from '@/components/common/page-shell'
import { TopNavSwitch } from '@/components/common/top-nav-switch'
import { UnifiedTopBar } from '@/components/common/unified-top-bar'
import { ProfileHistoryFeed } from '@/app/profile/_components/profile-history-feed'
import {
  PROFILE_WORKSPACE_HEIGHT_CLASS,
  ProfileSettingsDrawer,
} from '@/app/profile/_components/profile-settings-drawer'
import { ProfileSettingsPanel } from '@/app/profile/_components/profile-settings-panel'
import { useAuthSessionQuery, resolveSettingsReadOnly } from '@/lib/query/auth-session'
import { useRecommendationHistoryQuery } from '@/lib/query/recommendation-history'
import { useSaveUserSettingsMutation, useUserSettingsQuery } from '@/lib/query/user-settings'
import { cn } from '@/lib/utils'
import type { ProfileHistoryStatusFilter } from '@/shared/profile-memory'
import { APP_BRAND_TITLE, PAGE_COPY } from '@/shared/ui-copy'

const EMPTY_HISTORY_ITEMS: NonNullable<
  ReturnType<typeof useRecommendationHistoryQuery>['data']
>['items'] = []

export function ProfilePageClient() {
  const router = useRouter()
  const [statusFilter, setStatusFilter] = useState<ProfileHistoryStatusFilter>('all')
  const { data: authSession, isPending: authPending } = useAuthSessionQuery()
  const { data: userSettings } = useUserSettingsQuery()
  const historyQuery = useRecommendationHistoryQuery()
  const saveUserSettingsMutation = useSaveUserSettingsMutation()

  const user =
    authSession && authSession.authenticated === true && 'user' in authSession
      ? (authSession.user ?? null)
      : null
  const isAuthenticated = user != null
  const settingsReadOnly = resolveSettingsReadOnly(authPending, authSession?.authenticated)
  const historyItems = historyQuery.data?.items ?? EMPTY_HISTORY_ITEMS

  useEffect(() => {
    if (authPending) return
    if (!isAuthenticated) {
      router.replace('/login?next=/profile')
    }
  }, [authPending, isAuthenticated, router])

  const saveUserSettings = (next: Parameters<typeof saveUserSettingsMutation.mutate>[0]) => {
    if (authPending || !isAuthenticated) return
    saveUserSettingsMutation.mutate(next)
  }

  if (!authPending && !isAuthenticated) return null

  return (
    <PageShell
      contentClassName="pb-8 pt-4 sm:pt-5 lg:pt-6"
      header={
        <UnifiedTopBar
          title={APP_BRAND_TITLE}
          subtitle={PAGE_COPY.profile.subtitle}
          rightSlot={
            <div className="flex items-center gap-1.5">
              <TopNavSwitch current="profile" />
              <LoginEntryButton active />
            </div>
          }
        />
      }
    >
      <div className="flex flex-col gap-5 overflow-visible xl:flex-row xl:items-stretch">
        <main
          className={cn('flex min-h-0 min-w-0 flex-1 flex-col', PROFILE_WORKSPACE_HEIGHT_CLASS)}
        >
          <ProfileHistoryFeed
            className="min-h-0 xl:h-full"
            items={historyItems}
            statusFilter={statusFilter}
            loading={historyQuery.isPending && isAuthenticated}
            error={historyQuery.isError}
            onStatusFilterChange={setStatusFilter}
          />
        </main>

        <ProfileSettingsDrawer>
          <ProfileSettingsPanel
            className="xl:h-full"
            settings={userSettings}
            readOnly={settingsReadOnly}
            onSave={saveUserSettings}
          />
        </ProfileSettingsDrawer>
      </div>
    </PageShell>
  )
}
