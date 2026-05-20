'use client'

import { type RefObject, useLayoutEffect } from 'react'
import { ensureIntroGsap, gsap, ScrollTrigger } from '@/lib/intro/gsap'
import { INTRO_TOKENS } from '@/lib/intro/tokens'

type IntroStoryRefs = {
  rootRef: RefObject<HTMLElement | null>
  heroRef: RefObject<HTMLElement | null>
  heroVisualRef: RefObject<HTMLDivElement | null>
  judgementRef: RefObject<HTMLElement | null>
  judgementTrackRef: RefObject<HTMLDivElement | null>
  marketRef: RefObject<HTMLElement | null>
  pocketRef: RefObject<HTMLElement | null>
  pocketOrbitRef: RefObject<HTMLDivElement | null>
  finalRef: RefObject<HTMLElement | null>
}

type SetActiveScene = (scene: string) => void

export function useIntroScrollStory(
  refs: IntroStoryRefs,
  reducedMotion: boolean,
  setActiveScene?: SetActiveScene,
) {
  useLayoutEffect(() => {
    const root = refs.rootRef.current
    if (!root) return

    ensureIntroGsap()

    const context = gsap.context(() => {
      const sections = root.querySelectorAll<HTMLElement>('[data-intro-reveal]')
      const sceneStages = {
        hero: { scale: 1, y: 0, opacity: 0.4 },
        judgement: { scale: 1.02, y: -12, opacity: 0.56 },
        market: { scale: 1.01, y: -10, opacity: 0.36 },
        pocket: { scale: 1.03, y: -26, opacity: 0.62 },
        final: { scale: 1.02, y: -22, opacity: 0.52 },
      } as const

      const applySceneStage = (scene: keyof typeof sceneStages) => {
        const stage = sceneStages[scene]
        gsap.to(root, {
          '--intro-stage-scale': stage.scale,
          '--intro-stage-y': `${stage.y}px`,
          '--intro-grid-opacity-value': stage.opacity,
          duration: 0.65,
          ease: 'power2.out',
          overwrite: 'auto',
        })
        setActiveScene?.(scene)
      }

      if (reducedMotion) {
        gsap.set(sections, { clearProps: 'all', opacity: 1, y: 0 })
        gsap.set(root, {
          '--intro-stage-scale': 1,
          '--intro-stage-y': '0px',
          '--intro-grid-opacity-value': 0.4,
        })
        return
      }

      gsap.set(root, {
        '--intro-stage-scale': 1,
        '--intro-stage-y': '0px',
        '--intro-grid-opacity-value': 0.4,
      })

      gsap.fromTo(
        sections,
        { opacity: 0, y: INTRO_TOKENS.revealY },
        {
          opacity: 1,
          y: 0,
          duration: INTRO_TOKENS.revealDuration,
          ease: INTRO_TOKENS.sectionEase,
          stagger: 0.08,
        },
      )

      if (refs.heroVisualRef.current && refs.heroRef.current) {
        ScrollTrigger.create({
          trigger: refs.heroRef.current,
          start: 'top center',
          end: 'bottom center',
          onEnter: () => applySceneStage('hero'),
          onEnterBack: () => applySceneStage('hero'),
        })
        gsap.to(refs.heroVisualRef.current, {
          y: -INTRO_TOKENS.heroParallax,
          ease: 'none',
          scrollTrigger: {
            trigger: refs.heroRef.current,
            start: 'top top',
            end: 'bottom top',
            scrub: true,
          },
        })
      }

      if (refs.judgementRef.current && refs.judgementTrackRef.current) {
        ScrollTrigger.create({
          trigger: refs.judgementRef.current,
          start: 'top center',
          end: 'bottom center',
          onEnter: () => applySceneStage('judgement'),
          onEnterBack: () => applySceneStage('judgement'),
        })
        const cards =
          refs.judgementTrackRef.current.querySelectorAll<HTMLElement>('[data-judgement-card]')
        gsap.fromTo(
          cards,
          { opacity: 0.18, y: 30, scale: 0.94 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            stagger: 0.18,
            duration: 0.6,
            scrollTrigger: {
              trigger: refs.judgementRef.current,
              start: 'top 72%',
              end: 'bottom 45%',
              scrub: 0.45,
            },
          },
        )
      }

      if (refs.marketRef.current) {
        ScrollTrigger.create({
          trigger: refs.marketRef.current,
          start: 'top center',
          end: 'bottom center',
          onEnter: () => applySceneStage('market'),
          onEnterBack: () => applySceneStage('market'),
        })
        const marketRows =
          refs.marketRef.current.querySelectorAll<HTMLElement>('[data-market-lane]')
        marketRows.forEach((lane, index) => {
          gsap.fromTo(
            lane,
            {
              xPercent: index % 2 === 0 ? -INTRO_TOKENS.laneShift : INTRO_TOKENS.laneShift,
              opacity: 0.35,
            },
            {
              xPercent: 0,
              opacity: 1,
              ease: 'none',
              scrollTrigger: {
                trigger: refs.marketRef.current,
                start: 'top 78%',
                end: 'bottom 35%',
                scrub: true,
              },
            },
          )
        })
      }

      if (refs.pocketRef.current && refs.pocketOrbitRef.current) {
        ScrollTrigger.create({
          trigger: refs.pocketRef.current,
          start: 'top center',
          end: 'bottom center',
          onEnter: () => applySceneStage('pocket'),
          onEnterBack: () => applySceneStage('pocket'),
        })
        const orbitItems =
          refs.pocketOrbitRef.current.querySelectorAll<HTMLElement>('[data-pocket-node]')
        gsap.fromTo(
          orbitItems,
          {
            y: 28,
            opacity: 0.35,
            scale: 0.96,
          },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            stagger: 0.1,
            duration: 0.55,
            scrollTrigger: {
              trigger: refs.pocketRef.current,
              start: 'top 72%',
              end: 'bottom 38%',
              scrub: 0.35,
            },
          },
        )
        gsap.fromTo(
          '[data-pocket-core]',
          { scale: 0.96, opacity: 0.8 },
          {
            scale: 1,
            opacity: 1,
            duration: 0.55,
            scrollTrigger: {
              trigger: refs.pocketRef.current,
              start: 'top 64%',
              end: 'bottom 38%',
              scrub: 0.3,
            },
          },
        )
      }

      if (refs.finalRef.current) {
        ScrollTrigger.create({
          trigger: refs.finalRef.current,
          start: 'top center',
          end: 'bottom center',
          onEnter: () => applySceneStage('final'),
          onEnterBack: () => applySceneStage('final'),
        })
        gsap.fromTo(
          refs.finalRef.current.querySelectorAll('[data-final-cta]'),
          { opacity: 0, y: 26, scale: 0.96 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.55,
            stagger: 0.1,
            scrollTrigger: {
              trigger: refs.finalRef.current,
              start: 'top 80%',
            },
          },
        )
      }
    }, root)

    return () => context.revert()
  }, [reducedMotion, refs, setActiveScene])
}
