'use client'

import { useMemo, useState, type RefObject } from 'react'
import { Button } from '@/components/ui/button'
import {
  DisplayPanel,
  DisplayPanelContent,
  DisplayPanelDescription,
  DisplayPanelHeader,
  DisplayPanelTitle,
} from '@/components/ui/display-shell'
import { cn } from '@/lib/utils'

const MEMORY_ITEMS = {
  preference: {
    title: '偏好画像',
    summary: '系统会记住你更偏好哪类帮助、价格门槛与执行方式。',
    items: [
      '把“免登录优先”“中文体验更好”这类真实偏好带回下一次裁决。',
      '不让你每次都重新说明自己的习惯。',
      '让下一次推荐更像在延续你，而不是重新认识你。',
    ],
  },
  history: {
    title: '历史记忆',
    summary: '系统会记录你最近真正打开、保存、复用过什么。',
    items: [
      '知道哪些帮助只是浏览过，哪些是被你证明过有效的。',
      '让下一次不是从零开始，而是从已有记忆出发。',
      '让推荐更贴近你已经形成的工作方式。',
    ],
  },
  feedback: {
    title: '结果回流',
    summary: '收藏、跳过、替换、归档都会回流成新的判断信号。',
    items: [
      '系统逐渐懂得“对你有效”不是抽象偏好，而是被结果验证过。',
      '越用越像在关键时刻替你出手，而不是只会展示选项。',
      '解释层、推荐层和沉淀层会越来越一致。',
    ],
  },
} as const

type IntroMemorySectionProps = {
  sectionRef: RefObject<HTMLElement | null>
}

export function IntroMemorySection({ sectionRef }: IntroMemorySectionProps) {
  const [activePanel, setActivePanel] = useState<keyof typeof MEMORY_ITEMS>('preference')
  const activeContent = useMemo(() => MEMORY_ITEMS[activePanel], [activePanel])

  return (
    <section id="intro-memory" ref={sectionRef} className="py-10 lg:min-h-[calc(100vh-7rem)] lg:py-16">
      <div className="rounded-[2.6rem] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(244,247,255,0.92))] p-6 shadow-[0_24px_80px_rgba(15,23,42,0.10)] backdrop-blur-xl lg:flex lg:min-h-[calc(100vh-9rem)] lg:flex-col lg:justify-center lg:p-8">
        <div className="space-y-4" data-intro-reveal>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">第六幕 / 越用越懂你</p>
          <h2 className="max-w-4xl text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            DoraPocket 最终不是更会展示工具，而是更会在关键时刻替你出手。
          </h2>
          <p className="max-w-3xl text-base leading-8 text-slate-600">
            收藏、复用、跳过、偏好校准、历史回流，都会慢慢变成对你的理解。系统不只是记住你喜欢什么，而是更懂什么样的帮助在这个情境里真的有效。
          </p>
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] xl:items-start">
          <div className="space-y-3" data-intro-reveal>
            {Object.entries(MEMORY_ITEMS).map(([key, panel], index) => (
              <Button
                key={key}
                type="button"
                onClick={() => setActivePanel(key as keyof typeof MEMORY_ITEMS)}
                variant={activePanel === key ? 'default' : 'outline'}
                className={cn(
                  'h-auto w-full rounded-[1.8rem] p-4 text-left shadow-sm transition-all',
                  activePanel === key
                    ? 'border-sky-200 bg-sky-500 text-white shadow-[0_16px_34px_rgba(14,165,233,0.18)]'
                    : 'border-white/80 bg-white/92 text-slate-700 hover:bg-white',
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className={cn('text-[11px] font-bold uppercase tracking-[0.18em]', activePanel === key ? 'text-sky-100' : 'text-primary')}>
                      0{index + 1}
                    </p>
                    <p className="mt-2 text-lg font-black">{panel.title}</p>
                    <p className={cn('mt-2 text-sm leading-7', activePanel === key ? 'text-sky-50' : 'text-slate-600')}>
                      {panel.summary}
                    </p>
                  </div>
                </div>
              </Button>
            ))}
          </div>

          <div className="space-y-4">
            <DisplayPanel data-memory-item className="rounded-[2rem] bg-white/92 p-5 shadow-sm">
              <DisplayPanelHeader className="p-0">
                <DisplayPanelTitle className="text-xl text-slate-950">{activeContent.title}</DisplayPanelTitle>
                <DisplayPanelDescription className="mt-3 text-sm text-slate-600">{activeContent.summary}</DisplayPanelDescription>
              </DisplayPanelHeader>
              <DisplayPanelContent className="mt-5 grid gap-3 p-0">
                {activeContent.items.map((item) => (
                  <DisplayPanel
                    key={item}
                    data-memory-item
                    className="rounded-[1.4rem] border-slate-100 bg-slate-50/80 p-4 shadow-none"
                  >
                    <p className="text-sm font-bold leading-7 text-slate-700">{item}</p>
                  </DisplayPanel>
                ))}
              </DisplayPanelContent>
            </DisplayPanel>
          </div>
        </div>
      </div>
    </section>
  )
}
