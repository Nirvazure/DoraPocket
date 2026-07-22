import Link from 'next/link'
import { Suspense } from 'react'
import { LoginPocketStage } from '@/app/login/_components/login-pocket-stage'
import { OAuthLoginForm } from '@/app/login/_components/oauth-login-form'
import { PageShell } from '@/components/common/page-shell'
import { UnifiedTopBar } from '@/components/common/unified-top-bar'
import { APP_BRAND_TITLE } from '@/shared/copy/ui-copy'

import './_components/login-pocket-stage.css'

export default function LoginPage() {
  return (
    <PageShell
      header={
        <UnifiedTopBar
          title={APP_BRAND_TITLE}
          subtitle="登录后，口袋才会跟着你走。"
          rightSlot={
            <Link
              href="/analyse"
              className="rounded-full px-3 py-2 text-sm font-medium text-foreground/60 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              返回分析
            </Link>
          }
        />
      }
    >
      <section className="dp-page-surface mx-auto flex w-full max-w-xl flex-col items-center gap-8 p-8 text-center sm:gap-10 sm:p-10">
        <h1 className="login-stage-enter text-3xl font-black tracking-tight text-foreground sm:text-4xl">
          {APP_BRAND_TITLE}
        </h1>

        <LoginPocketStage />

        <Suspense fallback={null}>
          <OAuthLoginForm />
        </Suspense>
      </section>
    </PageShell>
  )
}
