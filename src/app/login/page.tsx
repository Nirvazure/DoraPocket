import { MagicLinkLoginForm } from '@/components/auth/magic-link-login-form'
import { UnifiedTopBar } from '@/components/common/unified-top-bar'
import { PageShell } from '@/components/common/page-shell'

export default function LoginPage() {
  return (
    <PageShell
      header={<UnifiedTopBar title="登录 DoraPocket" subtitle="同步口袋、偏好和推荐记忆到云端" />}
    >
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-6 rounded-[2rem] border border-white/80 bg-white/92 p-8 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
        <div className="space-y-3">
          <p className="text-sm font-black uppercase tracking-[0.22em] text-primary">
            Cloud Memory
          </p>
          <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">
            登录后，DoraPocket 才会真正记得你。
          </h1>
          <p className="max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
            登录后可以同步云端口袋、用户偏好、市场反馈和推荐会话，让下一次打开不再从零开始。
            当前版本面向海外展示环境部署。
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {['云端口袋同步', '偏好与反馈回流', '跨设备继续分析'].map((item) => (
            <div
              key={item}
              className="rounded-[1.5rem] border border-slate-200/80 bg-slate-50/85 p-4 text-sm font-semibold text-foreground/80"
            >
              {item}
            </div>
          ))}
        </div>
        <MagicLinkLoginForm />
      </section>
    </PageShell>
  )
}
