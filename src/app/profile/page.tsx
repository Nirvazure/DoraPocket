import type { Metadata } from 'next'
import Link from 'next/link'
import { AppNav } from '@/components/common/app-nav'
import { PageShell } from '@/components/common/page-shell'
import { UnifiedTopBar } from '@/components/common/unified-top-bar'
import { APP_BRAND_TITLE } from '@/shared/copy/ui-copy'

export const metadata: Metadata = {
  title: '个人页待实现 | DoraPocket',
  description: '个人页待实现，敬请期待。',
}

export default function ProfileRoutePage() {
  return (
    <PageShell
      header={
        <UnifiedTopBar
          title={APP_BRAND_TITLE}
          subtitle="个人页正在准备中。"
          rightSlot={<AppNav current="profile" />}
        />
      }
    >
      <main className="flex min-h-[calc(100dvh-10rem)] items-center justify-center px-4 pb-12">
        <section className="dp-page-surface mx-auto flex w-full max-w-xl flex-col items-center p-8 text-center sm:p-12">
          <p className="text-xs font-bold tracking-[0.16em] text-sky-700">我的 Dora</p>
          <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            待实现
          </h1>
          <p className="mt-3 text-base text-slate-600">敬请期待</p>
          <Link
            href="/analyse"
            className="mt-8 inline-flex rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:border-sky-200 hover:text-sky-700"
          >
            返回分析
          </Link>
        </section>
      </main>
    </PageShell>
  )
}
