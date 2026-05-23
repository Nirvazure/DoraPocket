'use client'

import { useRef } from 'react'
import { IntroFinalCtaSection } from '@/components/intro/intro-final-cta-section'
import { IntroHeroSection } from '@/components/intro/intro-hero-section'
import { IntroJudgementSection } from '@/components/intro/intro-judgement-section'
import { IntroMarketSection } from '@/components/intro/intro-market-section'
import { IntroPocketSection } from '@/components/intro/intro-pocket-section'
import { IntroSideProgress } from '@/components/intro/intro-side-progress'
import { IntroTopBar } from '@/components/intro/intro-top-bar'

const INTRO_PAGE_BACKGROUND =
  'bg-[radial-gradient(circle_at_top,rgba(186,230,253,0.34),transparent_28%),radial-gradient(circle_at_85%_18%,rgba(196,181,253,0.2),transparent_24%),linear-gradient(180deg,#f5fbff_0%,#eff6ff_36%,#e8f0fb_100%)]'

const SCENE_DIVIDERS = [
  { from: '求助瞬间', to: '理解与裁决' },
  { from: '理解与裁决', to: '道具库' },
  { from: '道具库', to: '我的口袋' },
  { from: '我的口袋', to: '现在开始' },
] as const

function IntroSceneDivider({ from, to }: { from: string; to: string }) {
  return (
    <div
      aria-hidden
      className="relative flex h-24 items-center justify-center overflow-hidden sm:h-28"
    >
      <div className="absolute inset-x-[14%] top-1/2 h-px -translate-y-1/2 bg-gradient-to-r from-transparent via-sky-200/80 to-transparent" />
      <div className="absolute inset-x-1/4 top-1/2 h-16 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.9),rgba(255,255,255,0))] blur-2xl" />
      <div className="relative inline-flex items-center gap-3 rounded-full border border-white/85 bg-white/72 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500 shadow-[0_16px_40px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:text-[11px]">
        <span>{from}</span>
        <span className="h-px w-8 bg-gradient-to-r from-sky-200 to-violet-200" />
        <span className="text-sky-700">{to}</span>
      </div>
    </div>
  )
}

export function IntroPage() {
  const heroRef = useRef<HTMLElement | null>(null)
  const heroVisualRef = useRef<HTMLDivElement | null>(null)
  const judgementRef = useRef<HTMLElement | null>(null)
  const judgementTrackRef = useRef<HTMLDivElement | null>(null)
  const marketRef = useRef<HTMLElement | null>(null)
  const pocketRef = useRef<HTMLElement | null>(null)
  const pocketOrbitRef = useRef<HTMLDivElement | null>(null)
  const finalRef = useRef<HTMLElement | null>(null)

  return (
    <div className={`min-h-screen text-slate-900 ${INTRO_PAGE_BACKGROUND}`}>
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[-8rem] top-24 h-72 w-72 rounded-full bg-sky-300/24 blur-3xl" />
        <div className="absolute right-[-6rem] top-[22rem] h-80 w-80 rounded-full bg-violet-300/18 blur-3xl" />
        <div className="absolute bottom-20 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-cyan-200/18 blur-3xl" />
        <div className="absolute inset-x-0 top-[8vh] h-[38vh] bg-gradient-to-b from-white/0 via-sky-100/50 to-white/0 blur-3xl" />
        <div className="absolute inset-x-0 top-[16vh] h-[44vh] bg-gradient-to-r from-sky-100/55 via-white/0 to-violet-100/30 blur-3xl" />
        <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(90deg,rgba(255,255,255,0.3)_1px,transparent_1px),linear-gradient(180deg,rgba(255,255,255,0.24)_1px,transparent_1px)] [background-size:96px_96px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0),rgba(255,255,255,0.5)_68%,rgba(255,255,255,0.78)_100%)]" />
      </div>
      <IntroSideProgress />
      <IntroTopBar />
      <main className="relative mx-auto flex max-w-[1440px] flex-col px-4 pb-24 pt-4 sm:px-6 lg:px-8">
        <IntroHeroSection sectionRef={heroRef} visualRef={heroVisualRef} />
        <IntroSceneDivider {...SCENE_DIVIDERS[0]} />
        <IntroJudgementSection sectionRef={judgementRef} trackRef={judgementTrackRef} />
        <IntroSceneDivider {...SCENE_DIVIDERS[1]} />
        <IntroMarketSection sectionRef={marketRef} />
        <IntroSceneDivider {...SCENE_DIVIDERS[2]} />
        <IntroPocketSection sectionRef={pocketRef} orbitRef={pocketOrbitRef} />
        <IntroSceneDivider {...SCENE_DIVIDERS[3]} />
        <IntroFinalCtaSection sectionRef={finalRef} />
      </main>
    </div>
  )
}
