'use client'

import type { RefObject } from 'react'
import Link from 'next/link'
import { ArrowRight, ShoppingBag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DisplayPanel, DisplayPanelContent } from '@/components/ui/display-shell'

type IntroFinalCtaSectionProps = {
  sectionRef: RefObject<HTMLElement | null>
}

export function IntroFinalCtaSection({ sectionRef }: IntroFinalCtaSectionProps) {
  return (
    <section id="intro-final" ref={sectionRef} className="py-10 lg:min-h-[calc(100vh-7rem)] lg:py-16">
      <div className="rounded-[2.6rem] border border-slate-200/80 bg-slate-950 px-6 py-8 text-white shadow-[0_30px_90px_rgba(15,23,42,0.20)] lg:flex lg:min-h-[calc(100vh-9rem)] lg:flex-col lg:justify-center lg:px-8 lg:py-10">
        <div className="max-w-3xl space-y-4">
          <p data-final-cta className="text-[11px] font-bold uppercase tracking-[0.18em] text-sky-300">
            最后一幕 / 真正开始使用
          </p>
          <h2 data-final-cta className="text-3xl font-black tracking-tight sm:text-4xl">
            如果你现在就需要帮助，不必再看更多。直接去分析页，让 DoraPocket 替你先做这次裁决。
          </h2>
          <p data-final-cta className="text-base leading-8 text-slate-300">
            它会先给结论，再给理由，再给动作；真正值得留下来的帮助，会在你手里变成自己的口袋资产。
          </p>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {[
            { value: '先结论', label: '不是先展示过程' },
            { value: '可沉淀', label: '不是一次性推荐' },
            { value: '越用越准', label: '不是固定榜单' },
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
          <Button asChild data-final-cta className="h-12 rounded-full px-5 text-sm font-black shadow-[0_18px_34px_rgba(14,165,233,0.28)]">
            <Link href="/analyse">
              去分析页开始
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button
            asChild
            data-final-cta
            variant="outline"
            className="h-12 rounded-full border-white/20 bg-white/8 px-5 text-sm font-bold text-white hover:bg-white/12 hover:text-white"
          >
            <Link href="/market">
              <ShoppingBag className="h-4 w-4" />
              先逛市场
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
