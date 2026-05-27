import { Suspense } from 'react'
import { OAuthLoginForm } from '@/components/auth/oauth-login-form'
import { UnifiedTopBar } from '@/components/common/unified-top-bar'
import { PageShell } from '@/components/common/page-shell'

export default function LoginPage() {
  return (
    <PageShell
      header={
        <UnifiedTopBar title="登录 DoraPocket" subtitle="同步我的口袋、设置和推荐记忆到云端。" />
      }
    >
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-6 rounded-[2rem] border border-white/80 bg-white/92 p-8 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
        <div className="space-y-3">
          <p className="text-sm font-black uppercase tracking-[0.22em] text-primary">Cloud Sync</p>
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
              className="rounded-[1.5rem] border border-slate-200/80 bg-slate-50/85 p-4 text-sm font-semibold text-foreground/80"
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
