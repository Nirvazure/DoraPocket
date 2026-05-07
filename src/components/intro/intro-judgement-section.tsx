'use client'

import type { RefObject } from 'react'
import { Badge } from '@/components/ui/badge'
import {
  DisplayPanel,
  DisplayPanelContent,
  DisplayPanelDescription,
  DisplayPanelHeader,
  DisplayPanelTitle,
} from '@/components/ui/display-shell'

type IntroJudgementSectionProps = {
  sectionRef: RefObject<HTMLElement | null>
  trackRef: RefObject<HTMLDivElement | null>
}

const JUDGEMENT_CARDS = [
  {
    title: '先理解处境',
    body: '不是只听关键词，而是先抓住限制条件、使用环境、速度要求与开始门槛。',
    chips: ['限制条件', '时间窗口', '开始门槛'],
  },
  {
    title: '再收束候选',
    body: '从很多工具里先排掉此刻不合适的，把注意力留给最值得先试的少数方案。',
    chips: ['排除不适合', '收束到少数', '保留解释理由'],
  },
  {
    title: '最后给出裁决',
    body: '先给结论，再给理由，再给动作。用户看到的是方向，而不是一堆待研究的选项。',
    chips: ['先结论', '再理由', '再动作'],
  },
]

export function IntroJudgementSection({ sectionRef, trackRef }: IntroJudgementSectionProps) {
  return (
    <section
      id="intro-judgement"
      ref={sectionRef}
      className="relative py-10 lg:min-h-[calc(100vh-7rem)] lg:py-16"
    >
      <div className="rounded-[2.6rem] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(239,246,255,0.9))] p-6 shadow-[0_24px_80px_rgba(15,23,42,0.10)] backdrop-blur-xl lg:flex lg:min-h-[calc(100vh-9rem)] lg:flex-col lg:justify-center lg:p-8">
        <div data-intro-reveal className="max-w-3xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
            第二幕 / 理解与裁决
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            DoraPocket 的关键，不是聊天，而是替你把“这次先用什么”收束出来。
          </h2>
          <p className="mt-3 text-base leading-8 text-slate-600">
            它先识别这次到底卡在哪里，再把候选缩到足够少，最后把下一步讲清楚。这个过程不是展示给你看的中间态，而是系统内部必须完成的工作。
          </p>
        </div>

        <div ref={trackRef} className="mt-8 grid gap-4 lg:grid-cols-3">
          {JUDGEMENT_CARDS.map((card, index) => (
            <DisplayPanel
              key={card.title}
              data-judgement-card
              className={`rounded-[2rem] p-5 shadow-sm ${
                index === 2
                  ? 'border-sky-200 bg-sky-500 text-white shadow-[0_20px_50px_rgba(14,165,233,0.26)]'
                  : 'border-white/80 bg-white/90 text-slate-900'
              }`}
            >
              <DisplayPanelHeader className="p-0">
                <Badge
                  variant="outline"
                  className={
                    index === 2
                      ? 'w-fit border-white/15 bg-white/10 text-sky-100'
                      : 'w-fit border-sky-200 bg-sky-50 text-sky-800'
                  }
                >
                  0{index + 1}
                </Badge>
                <DisplayPanelTitle
                  className={`mt-3 text-2xl ${index === 2 ? 'text-white' : 'text-slate-950'}`}
                >
                  {card.title}
                </DisplayPanelTitle>
                <DisplayPanelDescription
                  className={`mt-3 text-sm ${index === 2 ? 'text-sky-50' : 'text-slate-600'}`}
                >
                  {card.body}
                </DisplayPanelDescription>
              </DisplayPanelHeader>
              <DisplayPanelContent className="mt-4 flex flex-wrap gap-2 p-0">
                {card.chips.map((chip) => (
                  <Badge
                    key={chip}
                    variant="outline"
                    className={
                      index === 2
                        ? 'border-white/15 bg-white/10 text-white'
                        : 'border-slate-200 bg-slate-50 text-slate-600'
                    }
                  >
                    {chip}
                  </Badge>
                ))}
              </DisplayPanelContent>
            </DisplayPanel>
          ))}
        </div>
        <DisplayPanel
          data-intro-reveal
          className="mt-6 rounded-[1.8rem] border-sky-100 bg-white/85 p-4 shadow-sm"
        >
          <DisplayPanelHeader className="p-0">
            <Badge className="w-fit">结论优先于过程展示</Badge>
          </DisplayPanelHeader>
          <DisplayPanelContent className="p-0 pt-2">
            <DisplayPanelDescription className="text-sm text-slate-600">
              用户不需要盯着系统怎样一步步思考，而是需要在关键时刻先看到一个可信的方向。Scroll
              只负责把这个逻辑讲清楚，不应该抢走裁决本身。
            </DisplayPanelDescription>
          </DisplayPanelContent>
        </DisplayPanel>
      </div>
    </section>
  )
}
