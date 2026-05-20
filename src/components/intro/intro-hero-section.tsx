'use client'

import { useMemo, useState, type RefObject } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DisplayPanel,
  DisplayPanelContent,
  DisplayPanelDescription,
  DisplayPanelHeader,
  DisplayPanelTitle,
} from '@/components/ui/display-shell'
import { cn } from '@/lib/utils'

type IntroHeroSectionProps = {
  sectionRef: RefObject<HTMLElement | null>
  visualRef: RefObject<HTMLDivElement | null>
}

const SCENARIOS = [
  {
    id: 'pdf',
    label: '办公小任务',
    title: '“我现在只想尽快找到最好用的 PDF 压缩工具。”',
    context: '时间紧、免费优先、免登录、中文界面更好。',
    decision: '先给最值得试的结论，再告诉你为什么不是另外两个更热门的选项。',
    tags: ['免费先试', '免登录', '立即开始'],
  },
  {
    id: 'research',
    label: '查资料写引用',
    title: '“我要查一个资料，还希望结果带可靠来源。”',
    context: '更在意准确度、需要引用、希望减少试错。',
    decision: '先裁决这次该走哪种研究路径，再明确哪些工具只适合补充。',
    tags: ['要引用', '准确优先', '少走弯路'],
  },
  {
    id: 'translate',
    label: '跨语言处理',
    title: '“我要快速翻译一段内容，但不能丢原意和结构。”',
    context: '速度要快，但不想只要字面翻译。',
    decision: '先判断更适合翻译工具、结构化整理，还是翻译加总结的组合流程。',
    tags: ['保留语义', '速度快', '结构清晰'],
  },
] as const

export function IntroHeroSection({ sectionRef, visualRef }: IntroHeroSectionProps) {
  const [activeScenario, setActiveScenario] = useState<(typeof SCENARIOS)[number]['id']>('pdf')
  const currentScenario = useMemo(
    () => SCENARIOS.find((scenario) => scenario.id === activeScenario) ?? SCENARIOS[0],
    [activeScenario],
  )

  return (
    <section
      id="intro-hero"
      ref={sectionRef}
      className="relative overflow-hidden py-10 sm:py-14 lg:min-h-[calc(100vh-5rem)] lg:py-16"
    >
      <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1.02fr)_minmax(22rem,0.98fr)]">
        <div className="space-y-6">
          <div data-intro-reveal className="space-y-4">
            <h1 className="max-w-4xl text-4xl font-black tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
              不是陪聊，也不是工具海。
              <span className="block text-primary">DoraPocket 会替你先做裁决。</span>
            </h1>
            <p className="max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
              当你赶时间、信息杂、候选很多时，它先理解处境，再给出此刻最值得先用的帮助；真正有价值的结果，再被沉淀进口袋。
            </p>
          </div>
          <div data-intro-reveal className="flex flex-wrap gap-2">
            {SCENARIOS.map((scenario) => (
              <Button
                key={scenario.id}
                type="button"
                onClick={() => setActiveScenario(scenario.id)}
                variant={scenario.id === activeScenario ? 'default' : 'outline'}
                className={cn(
                  'h-auto rounded-full px-4 py-2 text-xs font-bold shadow-sm transition-all',
                  scenario.id === activeScenario
                    ? 'border-sky-200 bg-sky-500 text-white shadow-[0_12px_28px_rgba(14,165,233,0.22)]'
                    : 'border-white/80 bg-white/92 text-slate-700 hover:bg-white',
                )}
              >
                {scenario.label}
              </Button>
            ))}
          </div>
          <DisplayPanel data-intro-reveal className="rounded-[1.8rem] bg-white/88 shadow-sm">
            <DisplayPanelHeader className="p-5 pb-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge>更快开始</Badge>
                <Badge>解释一致</Badge>
                <Badge>更懂上下文</Badge>
              </div>
            </DisplayPanelHeader>
            <DisplayPanelContent className="p-5 pt-0">
              <DisplayPanelDescription className="text-sm">
                它不是让你继续研究很多答案，而是替你先收敛出这次最值得先试的方案，并把理由讲清楚。
              </DisplayPanelDescription>
            </DisplayPanelContent>
          </DisplayPanel>
        </div>

        <div ref={visualRef} data-intro-reveal className="relative">
          <div className="absolute inset-0 rounded-[2.5rem] bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.22),transparent_30%),radial-gradient(circle_at_80%_10%,rgba(99,102,241,0.18),transparent_26%),linear-gradient(180deg,rgba(255,255,255,0.95),rgba(240,249,255,0.9))]" />
          <DisplayPanel className="relative rounded-[2.5rem] bg-white/72 p-5 shadow-[0_30px_90px_rgba(15,23,42,0.12)] backdrop-blur-2xl">
            <DisplayPanelContent className="p-0">
              <DisplayPanel className="rounded-[2rem] border-sky-100 bg-slate-950 p-5 text-white shadow-inner">
                <DisplayPanelHeader className="p-0">
                  <Badge className="w-fit border-white/10 bg-white/5 text-[11px] font-bold uppercase tracking-[0.18em] text-sky-300">
                    求助瞬间
                  </Badge>
                  <DisplayPanelTitle className="mt-3 text-xl text-white">
                    {currentScenario.title}
                  </DisplayPanelTitle>
                </DisplayPanelHeader>
                <DisplayPanelContent className="mt-5 space-y-3 p-0 text-sm text-slate-300">
                  <DisplayPanel className="rounded-2xl border-white/10 bg-white/5 p-3 text-blue-400 shadow-none">
                    <DisplayPanelContent className="p-0">
                      DoraPocket 先理解：{currentScenario.context}
                    </DisplayPanelContent>
                  </DisplayPanel>
                  <DisplayPanel className="rounded-2xl border-sky-400/20 bg-sky-400/10 p-3 text-sky-100 shadow-none">
                    <DisplayPanelContent className="p-0">
                      然后直接给出结论：{currentScenario.decision}
                    </DisplayPanelContent>
                  </DisplayPanel>
                </DisplayPanelContent>
                <div className="mt-4 flex flex-wrap gap-2">
                  {currentScenario.tags.map((tag) => (
                    <Badge
                      key={tag}
                      className="border-white/10 bg-white/5 px-3 py-1 text-[11px] font-bold text-slate-200"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </DisplayPanel>
            </DisplayPanelContent>
          </DisplayPanel>
        </div>
      </div>
    </section>
  )
}
