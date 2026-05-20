'use client'

import type { RefObject } from 'react'
import { Button } from '@/components/ui/button'
import {
  DisplayPanel,
  DisplayPanelContent,
  DisplayPanelDescription,
  DisplayPanelTitle,
} from '@/components/ui/display-shell'

const POCKET_AREAS = [
  {
    title: '账户信息',
    body: '登录状态、昵称、头像和账号入口都回到一个地方。',
  },
  {
    title: '设置',
    body: '决定 DoraPocket 怎么解释、怎么播报、什么时候替你记住。',
  },
  {
    title: '我的工具',
    body: '收藏、常用和以后还会再打开的工具，都统一收回口袋。',
  },
] as const

type IntroPocketSectionProps = {
  sectionRef: RefObject<HTMLElement | null>
  orbitRef: RefObject<HTMLDivElement | null>
}

export function IntroPocketSection({ sectionRef, orbitRef }: IntroPocketSectionProps) {
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
              第四幕 / 我的口袋
            </p>
            <h2 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              我的口袋不再是抽象未来概念，而是真正能用的“我的”页面。
            </h2>
            <p className="text-base leading-8 text-slate-600">
              这里不再承担过重的抽象叙事，只做三件实在的事：账户信息、设置、我的工具。
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              {POCKET_AREAS.map((item) => (
                <DisplayPanel
                  key={item.title}
                  className="rounded-[1.6rem] bg-white/84 p-4 text-sm shadow-sm"
                >
                  <DisplayPanelTitle className="text-base text-slate-950">
                    {item.title}
                  </DisplayPanelTitle>
                  <DisplayPanelDescription className="mt-2 text-sm leading-7 text-slate-600">
                    {item.body}
                  </DisplayPanelDescription>
                </DisplayPanel>
              ))}
            </div>
          </div>

          <div
            ref={orbitRef}
            className="relative overflow-hidden rounded-[2.4rem] border border-white/80 bg-[radial-gradient(circle_at_center,rgba(186,230,253,0.42),rgba(255,255,255,0.92)_58%)] p-5 shadow-[0_24px_72px_rgba(14,165,233,0.10)]"
          >
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.18em] text-sky-600/80">
              <span>我的口袋</span>
              <span>真实可用</span>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {POCKET_AREAS.map((item, index) => (
                <DisplayPanel
                  key={item.title}
                  data-pocket-node
                  data-offset-x={index % 2 === 0 ? -24 : 24}
                  data-offset-y={index < 2 ? 24 : -24}
                  className="rounded-[1.8rem] border bg-white/92 p-4 shadow-[0_12px_30px_rgba(14,165,233,0.10)]"
                >
                  <DisplayPanelTitle className="text-sm">{item.title}</DisplayPanelTitle>
                  <DisplayPanelDescription className="mt-2 text-xs leading-6 text-slate-600">
                    {item.body}
                  </DisplayPanelDescription>
                </DisplayPanel>
              ))}
            </div>

            <div className="mt-5 flex justify-center">
              <Button
                type="button"
                data-pocket-core
                className="inline-flex h-14 items-center justify-center rounded-full border border-sky-200 bg-sky-500 px-6 text-sm font-black text-white shadow-[0_20px_60px_rgba(14,165,233,0.26)]"
              >
                进入我的口袋
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
