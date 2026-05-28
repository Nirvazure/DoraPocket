'use client'

import Image from 'next/image'
import { LogIn, LogOut, UserRound } from 'lucide-react'
import { ProfileEntryPill } from '@/components/common/profile-entry-pill'
import { PageShell } from '@/components/common/page-shell'
import { TopNavSwitch } from '@/components/common/top-nav-switch'
import { UnifiedTopBar } from '@/components/common/unified-top-bar'
import { PocketSettingsPanel } from '@/components/pocket/pocket-settings-panel'
import { buttonVariants } from '@/components/ui/button'
import {
  DisplayPanel,
  DisplayPanelContent,
  DisplayPanelDescription,
  DisplayPanelTitle,
} from '@/components/ui/display-shell'
import { useAuthSessionQuery, resolveSettingsReadOnly } from '@/lib/query/auth-session'
import { useSaveUserSettingsMutation, useUserSettingsQuery } from '@/lib/query/user-settings'
import { cn } from '@/lib/utils'
import { PAGE_COPY } from '@/shared/ui-copy'

export function ProfilePage() {
  const { data: authSession, isPending: authPending } = useAuthSessionQuery()
  const { data: userSettings } = useUserSettingsQuery()
  const saveUserSettingsMutation = useSaveUserSettingsMutation()

  const user =
    authSession && authSession.authenticated === true && 'user' in authSession
      ? (authSession.user ?? null)
      : null
  const isAuthenticated = user != null
  const settingsReadOnly = resolveSettingsReadOnly(authPending, authSession?.authenticated)

  const saveUserSettings = (next: Parameters<typeof saveUserSettingsMutation.mutate>[0]) => {
    if (authPending || !isAuthenticated) return
    saveUserSettingsMutation.mutate(next)
  }

  return (
    <PageShell
      contentClassName="pb-8 pt-4 sm:pt-5 lg:pt-6"
      header={
        <UnifiedTopBar
          title={PAGE_COPY.profile.title}
          subtitle={PAGE_COPY.profile.subtitle}
          rightSlot={
            <div className="flex items-center gap-1.5">
              <TopNavSwitch />
              <ProfileEntryPill active />
            </div>
          }
        />
      }
    >
      <div className="grid gap-4 lg:grid-cols-[7fr_3fr] lg:items-start lg:gap-5">
        <div className="min-w-0">
          <PocketSettingsPanel
            settings={userSettings}
            readOnly={settingsReadOnly}
            onSave={saveUserSettings}
          />
        </div>

        <aside className="min-w-0 lg:sticky lg:top-6">
          <DisplayPanel className="rounded-[2.4rem] border-white/90 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(240,249,255,0.92)_55%,rgba(248,250,252,0.96)_100%)] shadow-[0_28px_86px_rgba(14,165,233,0.10)]">
            <DisplayPanelContent className="p-5 sm:p-6">
              <div className="flex flex-col items-center gap-4 text-center sm:items-start sm:text-left">
                <span className="inline-flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-[1.6rem] border border-white bg-white shadow-sm">
                  {user?.avatarSrc ? (
                    <Image
                      src={user.avatarSrc}
                      alt="我的头像"
                      width={64}
                      height={64}
                      unoptimized
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-500 text-white shadow-[0_14px_28px_rgba(14,165,233,0.18)]">
                      <UserRound className="h-5 w-5" />
                    </span>
                  )}
                </span>

                <div className="min-w-0 space-y-2">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-sky-700">
                    My Profile
                  </p>
                  <DisplayPanelTitle className="text-xl text-slate-950 sm:text-2xl">
                    {user?.nickname ?? '先登录，再同步你的设置'}
                  </DisplayPanelTitle>
                  <DisplayPanelDescription className="text-sm leading-7 text-slate-600">
                    {user
                      ? (user.email ?? '你的账户信息和 DoraPocket 偏好都会在这里收好。')
                      : '登录后，DoraPocket 才能替你同步设置，把偏好真正带走。'}
                  </DisplayPanelDescription>
                </div>

                {!isAuthenticated ? (
                  <a
                    href="/login"
                    className={cn(
                      buttonVariants({ variant: 'default' }),
                      'h-10 w-full rounded-full px-4 text-sm font-bold sm:w-auto',
                    )}
                  >
                    <LogIn className="h-4 w-4" />
                    去登录
                  </a>
                ) : (
                  <a
                    href="/api/auth/logout"
                    className={cn(
                      buttonVariants({ variant: 'outline' }),
                      'h-10 w-full rounded-full px-4 text-sm font-bold sm:w-auto',
                    )}
                  >
                    <LogOut className="h-4 w-4" />
                    退出登录
                  </a>
                )}
              </div>
            </DisplayPanelContent>
          </DisplayPanel>
        </aside>
      </div>
    </PageShell>
  )
}
