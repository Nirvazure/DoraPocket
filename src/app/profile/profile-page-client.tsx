'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LoginEntryButton } from '@/components/auth/login-entry-button'
import { PageShell } from '@/components/common/page-shell'
import { TopNavSwitch } from '@/components/common/top-nav-switch'
import { UnifiedTopBar } from '@/components/common/unified-top-bar'
import { ProfilePersonaDemo } from '@/app/profile/_components/profile-persona-demo'
import { useAuthSessionQuery } from '@/lib/query/auth-session'
import { APP_BRAND_TITLE, PAGE_COPY } from '@/shared/copy/ui-copy'

export function ProfilePageClient() {
  const router = useRouter()
  const { data: authSession, isPending: authPending } = useAuthSessionQuery()

  const user =
    authSession && authSession.authenticated === true && 'user' in authSession
      ? (authSession.user ?? null)
      : null
  const isAuthenticated = user != null

  useEffect(() => {
    if (authPending) return
    if (!isAuthenticated) {
      router.replace('/login?next=/profile')
    }
  }, [authPending, isAuthenticated, router])

  if (!authPending && !isAuthenticated) return null

  return (
    <PageShell
      contentClassName="pb-6 pt-4 sm:pb-7 sm:pt-5 lg:pb-8 lg:pt-6"
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
      <main className="flex flex-col">
        <ProfilePersonaDemo />
      </main>
    </PageShell>
  )
}
