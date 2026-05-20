'use client'

import type { RefObject } from 'react'
import Link from 'next/link'
import { ArrowRight, PackageSearch } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DisplayPanel, DisplayPanelContent } from '@/components/ui/display-shell'

type IntroFinalCtaSectionProps = {
  sectionRef: RefObject<HTMLElement | null>
}

export function IntroFinalCtaSection({ sectionRef }: IntroFinalCtaSectionProps) {
  return (
    <section
      id="intro-final"
      ref={sectionRef}
      className="py-10 lg:min-h-[calc(100vh-7rem)] lg:py-16"
    >
      <div className="rounded-[2.6rem] border border-slate-200/80 bg-slate-950 px-6 py-8 text-white shadow-[0_30px_90px_rgba(15,23,42,0.20)] lg:flex lg:min-h-[calc(100vh-9rem)] lg:flex-col lg:justify-center lg:px-8 lg:py-10">
        <div className="max-w-3xl space-y-4">
          <p
            data-final-cta
            className="text-[11px] font-bold uppercase tracking-[0.18em] text-sky-300"
          >
            最后一幕 / 现在开始
          </p>
          <h2 data-final-cta className="text-3xl font-black tracking-tight sm:text-4xl">
            真正的 DoraPocket，不在介绍页里，而在你说出任务之后。
          </h2>
          <p data-final-cta className="text-base leading-8 text-slate-300">
            它会先给结论，再给理由，再给动作。道具库负责继续成长，我的口袋负责收好你的工具，但主体验永远从这次先掏什么开始。
          </p>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {[
            { value: '先给结论', label: '不是先让你研究一堆工具' },
            { value: '道具库共建', label: '让 DoraPocket 的知识库持续成长' },
            { value: '我的口袋', label: '账户、设置、我的工具都回到一个页面' },
          ].map((item) => (
            <DisplayPanel
              key={item.value}
              data-final-cta
              className="rounded-[1.6rem] border-white/10 bg-white/6 px-4 py-4 shadow-sm"
            >
              <DisplayPanelContent className="p-0">
                <p className="text-lg font-black text-white">{item.value}</p>
                <p className="mt-2 text-xs font-semibold text-slate-300">{item.label}</p>
              </DisplayPanelContent>
            </DisplayPanel>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button
            nativeButton={false}
            render={<Link href="/analyse" />}
            data-final-cta
            className="h-12 rounded-full px-5 text-sm font-black shadow-[0_18px_34px_rgba(14,165,233,0.28)]"
          >
            去让 Dora 出手
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button
            nativeButton={false}
            render={<Link href="/market" />}
            data-final-cta
            variant="outline"
            className="h-12 rounded-full border-white/20 bg-white/8 px-5 text-sm font-bold text-white hover:bg-white/12 hover:text-white"
          >
            <PackageSearch className="h-4 w-4" />
            先逛道具库
          </Button>
        </div>
      </div>
    </section>
  )
}
