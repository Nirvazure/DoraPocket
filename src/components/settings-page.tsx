'use client'

import Link from 'next/link'
import { ArrowLeft, Settings } from 'lucide-react'
import { PageShell } from '@/components/common/page-shell'
import { ProfileEntryPill } from '@/components/common/profile-entry-pill'
import { TopNavSwitch } from '@/components/common/top-nav-switch'
import { UnifiedTopBar } from '@/components/common/unified-top-bar'
import { SettingsPanel } from '@/components/settings/settings-panel'
import { Button } from '@/components/ui/button'
import { useClearChatHistoryMutation } from '@/lib/query/chat-history'
import { useResetPreferenceProfileOverrideMutation } from '@/lib/query/market'
import {
  useSaveUserSettingsMutation,
  useUserSettingsQuery,
  useUserSettingsSubscription,
} from '@/lib/query/user-settings'
import { SETTINGS_COPY } from '@/shared/ui-copy'

export function SettingsPage() {
  useUserSettingsSubscription()
  const { data: settings } = useUserSettingsQuery()
  const saveUserSettingsMutation = useSaveUserSettingsMutation()
  const resetPreferenceProfileOverrideMutation = useResetPreferenceProfileOverrideMutation()
  const clearChatHistoryMutation = useClearChatHistoryMutation()

  if (!settings) return null

  return (
    <PageShell
      header={
        <UnifiedTopBar
          title={SETTINGS_COPY.title}
          subtitle={SETTINGS_COPY.subtitle}
          leftSlot={
            <Button
              asChild
              type="button"
              variant="outline"
              className="h-10 rounded-full bg-white/90 px-3 text-xs font-semibold sm:text-sm"
            >
              <Link href="/profile">
                <ArrowLeft className="h-4 w-4" />
                返回个人中心
              </Link>
            </Button>
          }
          rightSlot={
            <div className="flex items-center gap-2">
              <TopNavSwitch current="profile" />
              <ProfileEntryPill />
            </div>
          }
        />
      }
    >
      <section className="rounded-[2rem] border border-white/85 bg-[linear-gradient(135deg,rgba(255,255,255,0.97),rgba(238,246,255,0.95))] p-5 shadow-[0_20px_44px_rgba(15,23,42,0.08)] backdrop-blur-xl">
        <div className="flex items-start gap-3">
          <div className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-[1.35rem] bg-primary/10 text-primary shadow-sm">
            <Settings className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
              System Behavior
            </p>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-foreground">
              {SETTINGS_COPY.heading}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
              {SETTINGS_COPY.description}
            </p>
          </div>
        </div>
      </section>

      <SettingsPanel
        settings={settings}
        onSave={(next) => saveUserSettingsMutation.mutate(next)}
        onResetPreferenceProfile={() => resetPreferenceProfileOverrideMutation.mutate()}
        onClearChatHistory={() => clearChatHistoryMutation.mutate()}
        resetPreferencePending={resetPreferenceProfileOverrideMutation.isPending}
        clearHistoryPending={clearChatHistoryMutation.isPending}
      />
    </PageShell>
  )
}
