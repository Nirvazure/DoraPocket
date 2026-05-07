'use client'

import { useRef, useState } from 'react'
import { IntroFinalCtaSection } from '@/components/intro/intro-final-cta-section'
import { IntroHeroSection } from '@/components/intro/intro-hero-section'
import { IntroJudgementSection } from '@/components/intro/intro-judgement-section'
import { IntroMarketSection } from '@/components/intro/intro-market-section'
import { IntroMemorySection } from '@/components/intro/intro-memory-section'
import { IntroPocketSection } from '@/components/intro/intro-pocket-section'
import { IntroSideProgress } from '@/components/intro/intro-side-progress'
import { IntroTopBar } from '@/components/intro/intro-top-bar'
import { useIntroReducedMotion } from '@/hooks/use-intro-reduced-motion'
import { useIntroScrollStory } from '@/hooks/use-intro-scroll-story'
import { cn } from '@/lib/utils'

const SCENE_STYLES = {
  hero: {
    rootBackground:
      'bg-[radial-gradient(circle_at_top,rgba(186,230,253,0.34),transparent_28%),radial-gradient(circle_at_85%_18%,rgba(196,181,253,0.2),transparent_24%),linear-gradient(180deg,#f5fbff_0%,#eff6ff_36%,#e8f0fb_100%)]',
    leftGlow: 'bg-sky-300/24',
    rightGlow: 'bg-violet-300/18',
    bottomGlow: 'bg-cyan-200/18',
    ambientTint: 'from-white/0 via-sky-100/50 to-white/0',
    meshTone: 'from-sky-100/55 via-white/0 to-violet-100/30',
  },
  judgement: {
    rootBackground:
      'bg-[radial-gradient(circle_at_18%_22%,rgba(125,211,252,0.26),transparent_24%),radial-gradient(circle_at_82%_18%,rgba(167,139,250,0.18),transparent_24%),linear-gradient(180deg,#eff8ff_0%,#edf6ff_26%,#e3eefc_100%)]',
    leftGlow: 'bg-sky-300/30',
    rightGlow: 'bg-indigo-300/20',
    bottomGlow: 'bg-sky-200/28',
    ambientTint: 'from-white/0 via-sky-100/60 to-white/0',
    meshTone: 'from-sky-100/70 via-cyan-50/10 to-indigo-100/36',
  },
  market: {
    rootBackground:
      'bg-[radial-gradient(circle_at_22%_15%,rgba(186,230,253,0.18),transparent_22%),radial-gradient(circle_at_85%_18%,rgba(251,191,36,0.12),transparent_22%),linear-gradient(180deg,#f8fbff_0%,#f7fafc_30%,#edf4fb_100%)]',
    leftGlow: 'bg-sky-200/18',
    rightGlow: 'bg-amber-300/18',
    bottomGlow: 'bg-slate-200/22',
    ambientTint: 'from-white/0 via-slate-100/60 to-white/0',
    meshTone: 'from-slate-100/70 via-white/0 to-amber-100/24',
  },
  pocket: {
    rootBackground:
      'bg-[radial-gradient(circle_at_18%_18%,rgba(56,189,248,0.26),transparent_26%),radial-gradient(circle_at_84%_20%,rgba(34,211,238,0.16),transparent_24%),linear-gradient(180deg,#f2fbff_0%,#ebf9ff_28%,#e2f6ff_100%)]',
    leftGlow: 'bg-cyan-300/28',
    rightGlow: 'bg-sky-300/18',
    bottomGlow: 'bg-cyan-300/24',
    ambientTint: 'from-white/0 via-cyan-100/65 to-white/0',
    meshTone: 'from-cyan-100/70 via-white/0 to-sky-100/28',
  },
  memory: {
    rootBackground:
      'bg-[radial-gradient(circle_at_16%_16%,rgba(165,243,252,0.16),transparent_22%),radial-gradient(circle_at_84%_18%,rgba(196,181,253,0.18),transparent_24%),linear-gradient(180deg,#f8fbff_0%,#f2f8ff_32%,#e9f2fd_100%)]',
    leftGlow: 'bg-cyan-200/18',
    rightGlow: 'bg-violet-300/22',
    bottomGlow: 'bg-indigo-200/18',
    ambientTint: 'from-white/0 via-indigo-100/55 to-white/0',
    meshTone: 'from-cyan-100/55 via-white/0 to-violet-100/30',
  },
  final: {
    rootBackground:
      'bg-[radial-gradient(circle_at_14%_12%,rgba(56,189,248,0.18),transparent_24%),radial-gradient(circle_at_84%_16%,rgba(15,23,42,0.18),transparent_28%),linear-gradient(180deg,#f3faff_0%,#eaf4ff_24%,#dcecff_100%)]',
    leftGlow: 'bg-sky-400/26',
    rightGlow: 'bg-slate-400/18',
    bottomGlow: 'bg-cyan-300/24',
    ambientTint: 'from-white/0 via-sky-100/45 to-slate-200/25',
    meshTone: 'from-sky-100/60 via-white/0 to-slate-200/28',
  },
} as const

const SCENE_DIVIDERS = [
  { from: '求助瞬间', to: '理解与裁决' },
  { from: '理解与裁决', to: '市场反馈' },
  { from: '市场反馈', to: '口袋待实现' },
  { from: '口袋待实现', to: '记忆待开发' },
  { from: '记忆待开发', to: '开始使用' },
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
  const [activeScene, setActiveScene] = useState('hero')
  const rootRef = useRef<HTMLDivElement | null>(null)
  const heroRef = useRef<HTMLElement | null>(null)
  const heroVisualRef = useRef<HTMLDivElement | null>(null)
  const judgementRef = useRef<HTMLElement | null>(null)
  const judgementTrackRef = useRef<HTMLDivElement | null>(null)
  const marketRef = useRef<HTMLElement | null>(null)
  const pocketRef = useRef<HTMLElement | null>(null)
  const pocketOrbitRef = useRef<HTMLDivElement | null>(null)
  const memoryRef = useRef<HTMLElement | null>(null)
  const finalRef = useRef<HTMLElement | null>(null)
  const reducedMotion = useIntroReducedMotion()

  useIntroScrollStory(
    {
      rootRef,
      heroRef,
      heroVisualRef,
      judgementRef,
      judgementTrackRef,
      marketRef,
      pocketRef,
      pocketOrbitRef,
      memoryRef,
      finalRef,
    },
    reducedMotion,
    setActiveScene,
  )

  const sceneStyle = SCENE_STYLES[activeScene as keyof typeof SCENE_STYLES] ?? SCENE_STYLES.hero

  return (
    <div
      ref={rootRef}
      data-active-scene={activeScene}
      className={cn(
        'min-h-screen text-slate-900 transition-[background] duration-700 [--intro-grid-opacity-value:0.4] [--intro-stage-scale:1] [--intro-stage-y:0px]',
        sceneStyle.rootBackground,
      )}
    >
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className={cn(
            'absolute left-[-8rem] top-24 h-72 w-72 rounded-full blur-3xl transition-all duration-700',
            sceneStyle.leftGlow,
          )}
        />
        <div
          className={cn(
            'absolute right-[-6rem] top-[22rem] h-80 w-80 rounded-full blur-3xl transition-all duration-700',
            sceneStyle.rightGlow,
          )}
        />
        <div
          className={cn(
            'absolute bottom-20 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full blur-3xl transition-all duration-700',
            sceneStyle.bottomGlow,
          )}
        />
        <div
          className={cn(
            'absolute inset-x-0 top-[8vh] h-[38vh] bg-gradient-to-b blur-3xl transition-all duration-700',
            sceneStyle.ambientTint,
          )}
        />
        <div
          className={cn(
            'absolute inset-x-0 top-[16vh] h-[44vh] bg-gradient-to-r blur-3xl transition-all duration-700',
            sceneStyle.meshTone,
          )}
        />
        <div className="absolute inset-0 opacity-[var(--intro-grid-opacity-value)] transition-opacity duration-700 [background-image:linear-gradient(90deg,rgba(255,255,255,0.3)_1px,transparent_1px),linear-gradient(180deg,rgba(255,255,255,0.24)_1px,transparent_1px)] [background-size:96px_96px]" />
        <div
          className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0),rgba(255,255,255,0.5)_68%,rgba(255,255,255,0.78)_100%)] transition-all duration-700"
          style={{
            opacity: 'var(--intro-grid-opacity-value)',
            transform: 'translate3d(0,var(--intro-stage-y),0) scale(var(--intro-stage-scale))',
          }}
        />
      </div>
      <IntroSideProgress activeScene={activeScene} />
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
        <IntroMemorySection sectionRef={memoryRef} />
        <IntroSceneDivider {...SCENE_DIVIDERS[4]} />
        <IntroFinalCtaSection sectionRef={finalRef} />
      </main>
    </div>
  )
}
