'use client'

import { useCallback, useEffect, useRef } from 'react'
import {
  IDLE_ANALYSIS_FLOW,
  resolveAnalysisFlowAfterError,
  type AnalysisFlow,
} from '@/shared/analysis-stage-content'

const COVER_DURATION_MS = 2600
const REVEAL_DURATION_MS = 420

const WORKING_FLOW: AnalysisFlow = { phase: 'analyzing', beat: 'working' }
const REVEAL_FLOW: AnalysisFlow = { phase: 'analyzing', beat: 'reveal' }
const REVEALED_FLOW: AnalysisFlow = { phase: 'revealed', beat: 'working' }
const COVER_FLOW: AnalysisFlow = { phase: 'analyzing', beat: 'cover' }

type SetAnalysisFlow = (flow: AnalysisFlow) => void

export function useAnalysisFlowReveal(setAnalysisFlow: SetAnalysisFlow) {
  const analysisFlowRef = useRef<AnalysisFlow>(WORKING_FLOW)
  const revealTimerRef = useRef<number | null>(null)
  const coverTimerRef = useRef<number | null>(null)
  const revealQueuedAfterCoverRef = useRef(false)

  const syncFlow = useCallback(
    (flow: AnalysisFlow) => {
      analysisFlowRef.current = flow
      setAnalysisFlow(flow)
    },
    [setAnalysisFlow],
  )

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
    syncFlow(REVEALED_FLOW)
  }, [syncFlow])

  const enterRevealBeat = useCallback(() => {
    if (revealTimerRef.current) {
      window.clearTimeout(revealTimerRef.current)
      revealTimerRef.current = null
    }
    syncFlow(REVEAL_FLOW)
    revealTimerRef.current = window.setTimeout(() => {
      revealTimerRef.current = null
      enterRevealedBeat()
    }, REVEAL_DURATION_MS)
  }, [enterRevealedBeat, syncFlow])

  const finishCoverBeat = useCallback(() => {
    coverTimerRef.current = null
    const current = analysisFlowRef.current
    if (current.phase !== 'analyzing' || current.beat !== 'cover') return
    revealQueuedAfterCoverRef.current = false
    enterRevealBeat()
  }, [enterRevealBeat])

  const startCoverRecommendation = useCallback(() => {
    if (coverTimerRef.current || revealTimerRef.current) return
    const current = analysisFlowRef.current
    if (current.phase === 'revealed' || current.beat === 'reveal') return

    revealQueuedAfterCoverRef.current = false
    syncFlow(COVER_FLOW)
    coverTimerRef.current = window.setTimeout(finishCoverBeat, COVER_DURATION_MS)
  }, [finishCoverBeat, syncFlow])

  const requestRevealRecommendation = useCallback(
    (force = false) => {
      const current = analysisFlowRef.current

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
    syncFlow(WORKING_FLOW)
  }, [clearRevealTimers, syncFlow])

  const resetAnalysisFlowAfterError = useCallback(() => {
    clearRevealTimers()
    const nextFlow = resolveAnalysisFlowAfterError()
    syncFlow(nextFlow)
  }, [clearRevealTimers, syncFlow])

  const bindAnalysisFlowRef = useCallback((flow: AnalysisFlow) => {
    analysisFlowRef.current = flow
  }, [])

  useEffect(() => {
    return () => clearRevealTimers()
  }, [clearRevealTimers])

  return {
    analysisFlowRef,
    bindAnalysisFlowRef,
    clearRevealTimers,
    startCoverRecommendation,
    requestRevealRecommendation,
    prepareNewAgentTurn,
    resetAnalysisFlowAfterError,
    idleAnalysisFlow: IDLE_ANALYSIS_FLOW,
    workingFlow: WORKING_FLOW,
  }
}
