'use client'

import type { RefObject } from 'react'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  DisplayPanel,
  DisplayPanelContent,
  DisplayPanelHeader,
} from '@/components/ui/display-shell'

const SIGNAL_GROUPS = [
  {
    title: '市场表层信号',
    items: ['热度很高', '品牌很大', '评分不错', '最近很火'],
  },
  {
    title: '这次的真实阻力',
    items: ['注册门槛高', '上手偏慢', '中文体验一般', '不适合立刻开始'],
  },
] as const

const JUDGEMENT_LENSES = [
  '先看这次任务适不适配',
  '再看能不能立刻启动',
  '最后用市场口碑做佐证',
] as const

const DECISION_POINTS = ['免费先试', '免登录', '开始快', '理由清晰'] as const

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
                第三幕 / 市场反馈
              </p>
              <h2 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                市场保留提交和评价，但不抢主任务。
              </h2>
              <p className="text-base leading-8 text-slate-600">
                DoraPocket
                需要市场反馈来校准推荐，但用户不该先被工具海淹没。提交、评价和打开记录会作为证据回流，而不是替代这次裁决。
              </p>
            </div>

            <DisplayPanel className="rounded-[2rem] bg-white/92 p-5 shadow-sm">
              <DisplayPanelHeader className="p-0 pb-4">
                <Badge className="w-fit">裁决镜头</Badge>
              </DisplayPanelHeader>
              <Separator />
              <DisplayPanelContent className="mt-4 space-y-3 p-0 pt-4">
                {JUDGEMENT_LENSES.map((lens, index) => (
                  <DisplayPanel
                    key={lens}
                    data-intro-reveal
                    className="flex items-center gap-3 rounded-[1.4rem] border-slate-100 bg-slate-50/80 px-4 py-3 shadow-none"
                  >
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-sky-500 text-[11px] font-black text-white shadow-sm">
                      0{index + 1}
                    </span>
                    <p className="text-sm font-bold text-slate-700">{lens}</p>
                  </DisplayPanel>
                ))}
              </DisplayPanelContent>
            </DisplayPanel>
          </div>

          <div className="grid gap-4">
            <DisplayPanel
              data-intro-reveal
              data-market-lane
              className="overflow-hidden rounded-[2.2rem] bg-white/92 p-5 shadow-sm"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
                  反馈还没收束时
                </p>
                <Badge
                  variant="outline"
                  className="bg-slate-100 px-3 py-1 text-[10px] font-bold text-slate-500"
                >
                  Raw Signals
                </Badge>
              </div>
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {SIGNAL_GROUPS.map((group) => (
                  <DisplayPanel
                    key={group.title}
                    className="rounded-[1.6rem] border-slate-100 bg-[linear-gradient(180deg,rgba(248,250,252,0.95),rgba(255,255,255,0.92))] p-4 shadow-none"
                  >
                    <p className="text-xs font-black text-slate-800">{group.title}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {group.items.map((item) => (
                        <Badge
                          key={item}
                          variant="outline"
                          className="border-slate-200 bg-white px-3 py-1.5 text-[11px] font-bold text-slate-600"
                        >
                          {item}
                        </Badge>
                      ))}
                    </div>
                  </DisplayPanel>
                ))}
              </div>
            </DisplayPanel>

            <DisplayPanel
              data-intro-reveal
              className="relative overflow-hidden rounded-[2.2rem] border border-sky-100 bg-[linear-gradient(135deg,rgba(240,249,255,0.98),rgba(255,255,255,0.96))] p-5 shadow-[0_18px_40px_rgba(14,165,233,0.10)]"
            >
              <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-sky-200/30 blur-3xl" />
              <div className="relative">
                <Badge className="w-fit">DoraPocket 怎么使用这些反馈</Badge>
                <DisplayPanel className="mt-4 rounded-[1.7rem] bg-white/86 p-4 shadow-none">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center">
                    <DisplayPanel className="flex-1 rounded-[1.4rem] border-slate-100 bg-slate-50/80 px-4 py-4 shadow-none">
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                        先排除
                      </p>
                      <p className="mt-2 text-sm font-black text-slate-800">
                        跟当前任务无关的信号先退出画面
                      </p>
                    </DisplayPanel>
                    <div className="text-center text-lg font-black text-sky-500">→</div>
                    <DisplayPanel className="flex-1 rounded-[1.4rem] border-sky-200 bg-sky-50 px-4 py-4 shadow-none">
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-500">
                        再收束
                      </p>
                      <p className="mt-2 text-sm font-black text-sky-800">
                        留下能解释这次选择的证据
                      </p>
                    </DisplayPanel>
                  </div>
                </DisplayPanel>
              </div>
            </DisplayPanel>

            <DisplayPanel
              data-intro-reveal
              data-market-lane
              className="rounded-[2.2rem] border border-sky-200 bg-slate-950 p-5 text-white shadow-[0_24px_50px_rgba(15,23,42,0.18)]"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-sky-300">
                  用户最后看到的
                </p>
                <Badge className="border-white/10 bg-white/5 px-3 py-1 text-[10px] font-bold text-sky-100">
                  Final Judgement
                </Badge>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {DECISION_POINTS.map((item) => (
                  <Badge
                    key={item}
                    className="border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-bold text-slate-100"
                  >
                    {item}
                  </Badge>
                ))}
              </div>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
                所以市场页可以继续积累工具和反馈，但主路径仍然回到一个问题：这次先用什么。
              </p>
            </DisplayPanel>
          </div>
        </div>
      </div>
    </section>
  )
}
