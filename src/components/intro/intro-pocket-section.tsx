'use client'

import { useMemo, useState, type RefObject } from 'react'
import { Button } from '@/components/ui/button'
import {
  DisplayPanel,
  DisplayPanelContent,
  DisplayPanelDescription,
  DisplayPanelTitle,
} from '@/components/ui/display-shell'
import { cn } from '@/lib/utils'

const POCKET_NODES = [
  {
    label: '这次最合适的帮助',
    body: '先在分析页把这次最值得用的帮助收束出来。',
    accent: 'border-sky-200 bg-sky-50 text-sky-800',
  },
  {
    label: '已经试过且有效',
    body: '后续只沉淀被打开、验证过有效的路径。',
    accent: 'border-cyan-200 bg-cyan-50 text-cyan-800',
  },
  {
    label: '以后还会复用',
    body: '下次遇到相似任务，不再从零开始找。',
    accent: 'border-violet-200 bg-violet-50 text-violet-800',
  },
  {
    label: '低摩擦可启动',
    body: '目标不是堆收藏，而是留下可启动入口。',
    accent: 'border-amber-200 bg-amber-50 text-amber-800',
  },
] as const

type IntroPocketSectionProps = {
  sectionRef: RefObject<HTMLElement | null>
  orbitRef: RefObject<HTMLDivElement | null>
}

export function IntroPocketSection({ sectionRef, orbitRef }: IntroPocketSectionProps) {
  const [isActivated, setIsActivated] = useState(false)
  const headline = useMemo(
    () =>
      isActivated
        ? '口袋会在后续版本承接被验证过的帮助路径。'
        : '口袋先保留入口，等主裁决体验稳定后再真正做成资产系统。',
    [isActivated],
  )

  return (
    <section
      id="intro-pocket"
      ref={sectionRef}
      className="py-10 lg:min-h-[calc(100vh-7rem)] lg:py-16"
    >
      <div className="rounded-[2.8rem] border border-sky-100 bg-[linear-gradient(180deg,rgba(224,242,254,0.72),rgba(255,255,255,0.94))] p-6 shadow-[0_28px_90px_rgba(14,165,233,0.10)] lg:flex lg:min-h-[calc(100vh-9rem)] lg:flex-col lg:justify-center lg:p-8">
        <div className="grid gap-8 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] xl:items-start">
          <div data-intro-reveal className="max-w-3xl space-y-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
              第四幕 / 口袋待实现
            </p>
            <h2 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              {headline}
            </h2>
            <p className="text-base leading-8 text-slate-600">
              现在先把入口留下来，避免把半成品包装成成熟收藏夹。后续它会承接被证明有效的工具、参数和使用路径。
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                '现在不急着做复杂管理。',
                '先确认哪些帮助真的值得留下。',
                '后续再让口袋变成可复用资产系统。',
              ].map((item) => (
                <DisplayPanel
                  key={item}
                  className="rounded-[1.6rem] bg-white/84 p-4 text-sm font-bold leading-7 text-slate-700 shadow-sm"
                >
                  <DisplayPanelContent className="p-0">{item}</DisplayPanelContent>
                </DisplayPanel>
              ))}
            </div>
          </div>

          <div
            ref={orbitRef}
            className="relative overflow-hidden rounded-[2.4rem] border border-white/80 bg-[radial-gradient(circle_at_center,rgba(186,230,253,0.42),rgba(255,255,255,0.92)_58%)] p-5 shadow-[0_24px_72px_rgba(14,165,233,0.10)]"
          >
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.18em] text-sky-600/80">
              <span>先保留入口</span>
              <span>后续形成资产</span>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {POCKET_NODES.map((node, index) => (
                <DisplayPanel
                  key={node.label}
                  data-pocket-node
                  data-offset-x={index % 2 === 0 ? -24 : 24}
                  data-offset-y={index < 2 ? 24 : -24}
                  className={cn(
                    'rounded-[1.8rem] border bg-white/92 p-4 shadow-[0_12px_30px_rgba(14,165,233,0.10)] transition-all duration-300',
                    node.accent,
                    isActivated && 'translate-y-[-2px] shadow-[0_16px_40px_rgba(14,165,233,0.14)]',
                  )}
                >
                  <DisplayPanelTitle className="text-sm">{node.label}</DisplayPanelTitle>
                  <DisplayPanelDescription className="mt-2 text-xs leading-6 text-slate-600">
                    {node.body}
                  </DisplayPanelDescription>
                </DisplayPanel>
              ))}
            </div>

            <div className="mt-5 flex justify-center">
              <Button
                type="button"
                data-pocket-core
                onClick={() => setIsActivated((value) => !value)}
                className={cn(
                  'inline-flex h-14 items-center justify-center rounded-full border border-sky-200 bg-sky-500 px-6 text-sm font-black text-white shadow-[0_20px_60px_rgba(14,165,233,0.26)] transition-all duration-300',
                  isActivated &&
                    'scale-[1.03] bg-sky-600 shadow-[0_24px_72px_rgba(14,165,233,0.34)]',
                )}
              >
                {isActivated ? '入口已保留' : '查看口袋方向'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
