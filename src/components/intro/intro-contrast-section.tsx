'use client'

import type { RefObject } from 'react'
import { Bot, FolderKanban, Scale } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  DisplayPanel,
  DisplayPanelContent,
  DisplayPanelDescription,
  DisplayPanelHeader,
  DisplayPanelTitle,
} from '@/components/ui/display-shell'

type IntroContrastSectionProps = {
  sectionRef: RefObject<HTMLElement | null>
}

const CONTRAST_COLUMNS = [
  {
    title: '普通聊天机器人',
    summary: '擅长回应，但常把选择压力继续留给用户。',
    bullets: ['会讲很多', '可能继续追问', '未必给出结论'],
    icon: Bot,
    tone: 'border-violet-100 bg-[linear-gradient(180deg,rgba(245,243,255,0.92),rgba(255,255,255,0.96))]',
  },
  {
    title: '普通工具导航站',
    summary: '擅长收录，但收录本身不等于裁决。',
    bullets: ['候选很多', '比较成本高', '难知道先试哪一个'],
    icon: FolderKanban,
    tone: 'border-amber-100 bg-[linear-gradient(180deg,rgba(255,251,235,0.92),rgba(255,255,255,0.96))]',
  },
  {
    title: 'DoraPocket',
    summary: '先替你收束方向，再把高价值帮助留下来。',
    bullets: ['先结论', '再理由', '再动作'],
    icon: Scale,
    tone: 'border-sky-200 bg-[linear-gradient(180deg,rgba(240,249,255,0.96),rgba(255,255,255,0.98))] shadow-[0_18px_40px_rgba(14,165,233,0.12)]',
  },
] as const

export function IntroContrastSection({ sectionRef }: IntroContrastSectionProps) {
  return (
    <section id="intro-contrast" ref={sectionRef} className="py-10 lg:min-h-[calc(100vh-7rem)] lg:py-16">
      <div className="rounded-[2.6rem] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(248,250,252,0.9))] p-6 shadow-[0_24px_80px_rgba(15,23,42,0.10)] backdrop-blur-xl lg:flex lg:min-h-[calc(100vh-9rem)] lg:flex-col lg:justify-center lg:p-8">
        <div data-intro-reveal className="max-w-3xl space-y-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">第三幕 / 价值对比</p>
          <h2 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            用户真正缺的不是更多回答，也不是更多工具，而是“这次先怎么做”的方向感。
          </h2>
          <p className="text-base leading-8 text-slate-600">
            所以 DoraPocket 不是去堆更多内容，而是替你先把这次最值得先试的方向收束出来。
          </p>
        </div>

        <div className="mt-8 grid gap-4 xl:grid-cols-3">
          {CONTRAST_COLUMNS.map((column) => {
            const Icon = column.icon
            return (
              <DisplayPanel
                key={column.title}
                data-intro-reveal
                data-contrast-card
                className={`rounded-[2rem] border p-5 transition-all duration-300 ${column.tone}`}
              >
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/70 bg-white/90 text-slate-700 shadow-sm">
                  <Icon className="h-4 w-4" />
                </span>
                <DisplayPanelHeader className="p-0">
                  <DisplayPanelTitle className="mt-4 text-xl text-slate-950">{column.title}</DisplayPanelTitle>
                  <DisplayPanelDescription className="mt-2 text-sm text-slate-600">{column.summary}</DisplayPanelDescription>
                </DisplayPanelHeader>
                <DisplayPanelContent className="mt-4 space-y-2 p-0">
                  {column.bullets.map((bullet) => (
                    <Badge
                      key={bullet}
                      variant="outline"
                      className="flex rounded-full border-white/80 bg-white/88 px-3 py-2 text-xs font-bold text-slate-700"
                    >
                      {bullet}
                    </Badge>
                  ))}
                </DisplayPanelContent>
              </DisplayPanel>
            )
          })}
        </div>

        <DisplayPanel
          data-intro-reveal
          className="mt-6 rounded-[1.8rem] border border-sky-100 bg-[linear-gradient(135deg,rgba(240,249,255,0.95),rgba(255,255,255,0.94))] p-4 shadow-sm"
        >
          <DisplayPanelContent className="p-0">
            <p className="text-sm font-bold leading-7 text-slate-700">
              差别不在于“知道得更多”，而在于谁愿意替用户先承担这次判断。
            </p>
          </DisplayPanelContent>
        </DisplayPanel>
      </div>
    </section>
  )
}
