'use client'

import type { RefObject } from 'react'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  DisplayPanel,
  DisplayPanelContent,
  DisplayPanelHeader,
} from '@/components/ui/display-shell'

const LIBRARY_VALUES = [
  '发现现在就能用的工具',
  '把好工具提交进 DoraPocket',
  '补充真实体验，帮助下次判断更准',
] as const

const CONTRIBUTION_STEPS = [
  {
    title: '先发现',
    body: '它不是工具商店，而是 DoraPocket 背后的道具知识库入口。',
  },
  {
    title: '再补充',
    body: '用户可以把自己觉得好用的网站、软件和服务继续补进来。',
  },
  {
    title: '最后沉淀',
    body: '提交、打开、评分和收藏会逐步变成 DoraPocket 的工具判断证据。',
  },
] as const

type IntroMarketSectionProps = {
  sectionRef: RefObject<HTMLElement | null>
}

export function IntroMarketSection({ sectionRef }: IntroMarketSectionProps) {
  return (
    <section
      id="intro-market"
      ref={sectionRef}
      className="py-10 lg:min-h-[calc(100vh-7rem)] lg:py-16"
    >
      <div className="rounded-[2.8rem] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(244,249,255,0.94))] p-6 shadow-[0_28px_90px_rgba(15,23,42,0.10)] backdrop-blur-xl lg:flex lg:min-h-[calc(100vh-9rem)] lg:flex-col lg:justify-center lg:p-8">
        <div className="grid gap-8 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          <div data-intro-reveal className="space-y-5">
            <div className="space-y-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
                第三幕 / 道具库
              </p>
              <h2 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                道具库负责发现和共建，不抢 DoraPocket 主舞台。
              </h2>
              <p className="text-base leading-8 text-slate-600">
                当用户已经知道要做什么，DoraPocket
                先替他做裁决；当用户想补充新的好工具，道具库再承担发现、提交和知识沉淀。
              </p>
            </div>

            <DisplayPanel className="rounded-[2rem] bg-white/92 p-5 shadow-sm">
              <DisplayPanelHeader className="p-0 pb-4">
                <Badge className="w-fit">道具库价值</Badge>
              </DisplayPanelHeader>
              <Separator />
              <DisplayPanelContent className="mt-4 space-y-3 p-0 pt-4">
                {LIBRARY_VALUES.map((item, index) => (
                  <DisplayPanel
                    key={item}
                    data-intro-reveal
                    className="flex items-center gap-3 rounded-[1.4rem] border-slate-100 bg-slate-50/80 px-4 py-3 shadow-none"
                  >
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-sky-500 text-[11px] font-black text-white shadow-sm">
                      0{index + 1}
                    </span>
                    <p className="text-sm font-bold text-slate-700">{item}</p>
                  </DisplayPanel>
                ))}
              </DisplayPanelContent>
            </DisplayPanel>
          </div>

          <div className="grid gap-4">
            {CONTRIBUTION_STEPS.map((step) => (
              <DisplayPanel
                key={step.title}
                data-intro-reveal
                data-market-lane
                className="rounded-[2.2rem] bg-white/92 p-5 shadow-sm"
              >
                <Badge className="w-fit">{step.title}</Badge>
                <p className="mt-4 text-base font-black text-slate-950">{step.title}</p>
                <p className="mt-2 text-sm leading-7 text-slate-600">{step.body}</p>
              </DisplayPanel>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
