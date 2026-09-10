'use client'

import { useCallback, useEffect, useRef } from 'react'
import {
  resolveAnalysisFlowAfterError,
  type AnalysisFlow,
} from '@/app/analyse/_domain/analysis-stage-content'

import { selectAnalysisFlow, useStore } from '@/store'

const COVER_DURATION_MS = 3800
const REVEAL_DURATION_MS = 420

const WORKING_FLOW: AnalysisFlow = { phase: 'analyzing', beat: 'working' }
const REVEAL_FLOW: AnalysisFlow = { phase: 'analyzing', beat: 'reveal' }
const REVEALED_FLOW: AnalysisFlow = { phase: 'revealed', beat: 'working' }
const COVER_FLOW: AnalysisFlow = { phase: 'analyzing', beat: 'cover' }

type SetAnalysisFlow = (flow: AnalysisFlow) => void

export function useAnalysisFlowReveal(setAnalysisFlow: SetAnalysisFlow) {
  const revealTimerRef = useRef<number | null>(null)
  const coverTimerRef = useRef<number | null>(null)
  const revealQueuedAfterCoverRef = useRef(false)

  const clearRevealTimers = useCallback(() => {
    if (revealTimerRef.current) {
      window.clearTimeout(revealTimerRef.current)
      revealTimerRef.current = null
    }
    if (coverTimerRef.current) {
      window.clearTimeout(coverTimerRef.current)
      coverTimerRef.current = null
    }
    revealQueuedAfterCoverRef.current = false
  }, [])

  const enterRevealedBeat = useCallback(() => {
    setAnalysisFlow(REVEALED_FLOW)
  }, [setAnalysisFlow])

  const enterRevealBeat = useCallback(() => {
    if (revealTimerRef.current) {
      window.clearTimeout(revealTimerRef.current)
      revealTimerRef.current = null
    }
    setAnalysisFlow(REVEAL_FLOW)
    revealTimerRef.current = window.setTimeout(() => {
      revealTimerRef.current = null
      enterRevealedBeat()
    }, REVEAL_DURATION_MS)
  }, [enterRevealedBeat, setAnalysisFlow])

  const finishCoverBeat = useCallback(() => {
    coverTimerRef.current = null
    const current = selectAnalysisFlow(useStore.getState())
    if (current.phase !== 'analyzing' || current.beat !== 'cover') return
    revealQueuedAfterCoverRef.current = false
    enterRevealBeat()
  }, [enterRevealBeat])

  const startCoverRecommendation = useCallback(() => {
    if (coverTimerRef.current || revealTimerRef.current) return
    const current = selectAnalysisFlow(useStore.getState())
    if (current.phase === 'revealed' || current.beat === 'reveal') return

    revealQueuedAfterCoverRef.current = false
    setAnalysisFlow(COVER_FLOW)
    coverTimerRef.current = window.setTimeout(finishCoverBeat, COVER_DURATION_MS)
  }, [finishCoverBeat, setAnalysisFlow])

  const requestRevealRecommendation = useCallback(
    (force = false) => {
      const current = selectAnalysisFlow(useStore.getState())

      if (current.phase === 'revealed') return
      if (current.phase === 'analyzing' && current.beat === 'reveal') return

      if (
        !force &&
        (current.beat === 'cover' ||
          coverTimerRef.current != null ||
          revealQueuedAfterCoverRef.current)
      ) {
        revealQueuedAfterCoverRef.current = true
        return
      }

      clearRevealTimers()
      enterRevealBeat()
    },
    [clearRevealTimers, enterRevealBeat],
  )

  const prepareNewAgentTurn = useCallback(() => {
    clearRevealTimers()
    setAnalysisFlow(WORKING_FLOW)
  }, [clearRevealTimers, setAnalysisFlow])

  const resetAnalysisFlowAfterError = useCallback(() => {
    clearRevealTimers()
    const nextFlow = resolveAnalysisFlowAfterError()
    setAnalysisFlow(nextFlow)
  }, [clearRevealTimers, setAnalysisFlow])

  useEffect(() => {
    return () => clearRevealTimers()
  }, [clearRevealTimers])

  return {
    clearRevealTimers,
    startCoverRecommendation,
    requestRevealRecommendation,
    prepareNewAgentTurn,
    resetAnalysisFlowAfterError,
    workingFlow: WORKING_FLOW,
  }
}
