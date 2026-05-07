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
    summary: '这是待开发能力，不把当前薄弱画像包装成成熟结论。',
    items: [
      '后续会把“免登录优先”“中文体验更好”这类真实偏好带回下一次裁决。',
      '在数据不够之前，页面只说明方向，不展示过度推断。',
      '画像成熟后，推荐才应该明显减少重复解释成本。',
    ],
  },
  history: {
    title: '历史记忆',
    summary: '后续会记录你真正打开、保存、复用过什么。',
    items: [
      '区分哪些帮助只是浏览过，哪些被你证明过有效。',
      '让下一次不是从零开始，而是从已有路径出发。',
      '先保留数据结构和入口，等体验闭环稳定后再强化展示。',
    ],
  },
  feedback: {
    title: '结果回流',
    summary: '评价、打开、保存会逐步回流成推荐判断信号。',
    items: [
      '“对你有效”必须被结果验证，而不是靠页面文案宣布。',
      '市场反馈会先保留，等待推荐排序继续吸收。',
      '解释层、推荐层和沉淀层后续要保持一致。',
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
    <section
      id="intro-memory"
      ref={sectionRef}
      className="py-10 lg:min-h-[calc(100vh-7rem)] lg:py-16"
    >
      <div className="rounded-[2.6rem] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(244,247,255,0.92))] p-6 shadow-[0_24px_80px_rgba(15,23,42,0.10)] backdrop-blur-xl lg:flex lg:min-h-[calc(100vh-9rem)] lg:flex-col lg:justify-center lg:p-8">
        <div className="space-y-4" data-intro-reveal>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
            第五幕 / 记忆待开发
          </p>
          <h2 className="max-w-4xl text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            个人画像先降级为待开发，不再假装已经成熟。
          </h2>
          <p className="max-w-3xl text-base leading-8 text-slate-600">
            历史、偏好和反馈以后会让 DoraPocket
            更懂你。但在闭环真正稳定前，个人中心只保留方向说明和入口，不展示过度复杂的画像工作台。
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
                    <p
                      className={cn(
                        'text-[11px] font-bold uppercase tracking-[0.18em]',
                        activePanel === key ? 'text-sky-100' : 'text-primary',
                      )}
                    >
                      0{index + 1}
                    </p>
                    <p className="mt-2 text-lg font-black">{panel.title}</p>
                    <p
                      className={cn(
                        'mt-2 text-sm leading-7',
                        activePanel === key ? 'text-sky-50' : 'text-slate-600',
                      )}
                    >
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
                <DisplayPanelTitle className="text-xl text-slate-950">
                  {activeContent.title}
                </DisplayPanelTitle>
                <DisplayPanelDescription className="mt-3 text-sm text-slate-600">
                  {activeContent.summary}
                </DisplayPanelDescription>
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
