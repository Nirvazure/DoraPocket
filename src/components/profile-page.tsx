'use client'

import { useEffect } from 'react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ProfileEntryPill } from '@/components/common/profile-entry-pill'
import { PageShell } from '@/components/common/page-shell'
import { TopNavSwitch } from '@/components/common/top-nav-switch'
import { UnifiedTopBar } from '@/components/common/unified-top-bar'
import { ProfileHistoryFeed } from '@/components/profile/profile-history-feed'
import { ProfileSettingsPanel } from '@/components/profile/profile-settings-panel'
import { useAuthSessionQuery, resolveSettingsReadOnly } from '@/lib/query/auth-session'
import { useRecommendationHistoryQuery } from '@/lib/query/recommendation-history'
import { useSaveUserSettingsMutation, useUserSettingsQuery } from '@/lib/query/user-settings'
import type { ProfileHistoryStatusFilter } from '@/shared/profile-memory'
import { PAGE_COPY, APP_BRAND_TITLE } from '@/shared/ui-copy'

const EMPTY_HISTORY_ITEMS: NonNullable<
  ReturnType<typeof useRecommendationHistoryQuery>['data']
>['items'] = []

export function ProfilePage() {
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
              <ProfileEntryPill active />
            </div>
          }
        />
      }
    >
      <div className="grid gap-5 xl:min-h-[calc(100dvh-8.5rem)] xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
        <main className="flex min-h-0 min-w-0">
          <ProfileHistoryFeed
            className="w-full xl:min-h-[calc(100dvh-8.5rem)]"
            items={historyItems}
            statusFilter={statusFilter}
            loading={historyQuery.isPending && isAuthenticated}
            error={historyQuery.isError}
            onStatusFilterChange={setStatusFilter}
          />
        </main>

        <div className="min-w-0 xl:sticky xl:top-6">
          <ProfileSettingsPanel
            settings={userSettings}
            readOnly={settingsReadOnly}
            onSave={saveUserSettings}
          />
        </div>
      </div>
    </PageShell>
  )
}
