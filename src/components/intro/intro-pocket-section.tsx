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
    body: '这次最值得先用的帮助，会被明确收束出来。',
    accent: 'border-sky-200 bg-sky-50 text-sky-800',
  },
  {
    label: '已经试过且有效',
    body: '真正被打开、验证过有效的，才值得沉淀。',
    accent: 'border-cyan-200 bg-cyan-50 text-cyan-800',
  },
  {
    label: '以后还会复用',
    body: '下次遇到相似任务，可以直接从口袋调用。',
    accent: 'border-violet-200 bg-violet-50 text-violet-800',
  },
  {
    label: '低摩擦可启动',
    body: '它不是收藏链接，而是未来可再次启动的入口。',
    accent: 'border-amber-200 bg-amber-50 text-amber-800',
  },
] as const

type IntroPocketSectionProps = {
  sectionRef: RefObject<HTMLElement | null>
  orbitRef: RefObject<HTMLDivElement | null>
}

export function IntroPocketSection({
  sectionRef,
  orbitRef,
}: IntroPocketSectionProps) {
  const [isActivated, setIsActivated] = useState(false)
  const headline = useMemo(
    () =>
      isActivated
        ? '这次被证明有效的帮助，开始从一次性结果变成你自己的能力资产。'
        : '真正高价值的帮助，不该在一次使用后消失，而该沉淀成你的个人能力资产。',
    [isActivated],
  )

  return (
    <section id="intro-pocket" ref={sectionRef} className="py-10 lg:min-h-[calc(100vh-7rem)] lg:py-16">
      <div className="rounded-[2.8rem] border border-sky-100 bg-[linear-gradient(180deg,rgba(224,242,254,0.72),rgba(255,255,255,0.94))] p-6 shadow-[0_28px_90px_rgba(14,165,233,0.10)] lg:flex lg:min-h-[calc(100vh-9rem)] lg:flex-col lg:justify-center lg:p-8">
        <div className="grid gap-8 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] xl:items-start">
          <div data-intro-reveal className="max-w-3xl space-y-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">第五幕 / 沉淀入口袋</p>
            <h2 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              {headline}
            </h2>
            <p className="text-base leading-8 text-slate-600">
              市场里挑中的、这次真正有效的、未来还会反复复用的帮助，应该被吸附、归位、留下来，而不是在一次打开后重新散掉。
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                '不是保存链接，而是保存这次真的有效的帮助。',
                '不是单次结果，而是能被未来继续调用的入口。',
                '不是收藏夹升级版，而是个人能力资产系统。',
              ].map((item) => (
                <DisplayPanel key={item} className="rounded-[1.6rem] bg-white/84 p-4 text-sm font-bold leading-7 text-slate-700 shadow-sm">
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
              <span>候选被证明有效</span>
              <span>开始形成个人资产</span>
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
                  <DisplayPanelDescription className="mt-2 text-xs leading-6 text-slate-600">{node.body}</DisplayPanelDescription>
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
                  isActivated && 'scale-[1.03] bg-sky-600 shadow-[0_24px_72px_rgba(14,165,233,0.34)]',
                )}
              >
                {isActivated ? '已沉淀到口袋' : '点击收进口袋'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
