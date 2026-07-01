import { Suspense } from 'react'
import { OAuthLoginForm } from '@/app/login/_components/oauth-login-form'
import { LoginEntryButton } from '@/components/auth/login-entry-button'
import { PageShell } from '@/components/common/page-shell'
import { TopNavSwitch } from '@/components/common/top-nav-switch'
import { UnifiedTopBar } from '@/components/common/unified-top-bar'

import { APP_BRAND_TITLE } from '@/shared/ui-copy'

export default function LoginPage() {
  return (
    <PageShell
      header={
        <UnifiedTopBar
          title={APP_BRAND_TITLE}
          subtitle="同步我的口袋、设置和推荐记忆到云端。"
          rightSlot={
            <div className="flex items-center gap-1.5 sm:gap-2">
              <TopNavSwitch />
              <LoginEntryButton />
            </div>
          }
        />
      }
    >
      <section className="dp-page-surface mx-auto flex w-full max-w-3xl flex-col gap-6 p-8">
        <div className="space-y-3">
          <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">
            登录后，DoraPocket 才会真正把你的口袋带走。
          </h1>
          <p className="max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
            登录后可以同步我的工具、设置、道具库反馈和推荐会话，让下一次打开不用重新从零开始。
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {['我的口袋同步', '设置与反馈同步', '跨设备继续使用'].map((item) => (
            <div
              key={item}
              className="dp-secondary-surface p-4 text-sm font-semibold text-foreground/80"
            >
              {item}
            </div>
          ))}
        </div>
        <Suspense fallback={null}>
          <OAuthLoginForm />
        </Suspense>
      </section>
    </PageShell>
  )
}
