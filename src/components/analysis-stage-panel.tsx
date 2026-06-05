'use client'

import dynamic from 'next/dynamic'
import type { AnalysisFlow } from '@/components/discovery/analysis-stage-content'
import { StageVoiceFab } from '@/components/analysis/stage-voice-fab'
import { AnalysisStageStatusBar } from '@/components/analysis-stage-status-bar'
import { AnalysisStageCanvasFallback } from '@/components/analysis-stage-canvas-fallback'

const AnalysisStageCanvas = dynamic(
  () => import('@/components/analysis-stage-canvas').then((module) => module.AnalysisStageCanvas),
  {
    ssr: false,
    loading: () => <AnalysisStageCanvasFallback variant="loading" />,
  },
)
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { AppState } from '@/store'
import { ChevronDown, ChevronUp } from 'lucide-react'

type AnalysisStagePanelProps = {
  appState: AppState
  analysisFlow: AnalysisFlow
  mobileCompact?: boolean
  mobileCompactExpanded?: boolean
  onToggleMobileCompact?: () => void
  voiceFabDisabled?: boolean
  onHoldToTalkStart: () => void
  onHoldToTalkEnd: () => void
  onCancelVoiceInput: () => void
}

export function AnalysisStagePanel({
  appState,
  analysisFlow,
  mobileCompact = false,
  mobileCompactExpanded = false,
  onToggleMobileCompact,
  voiceFabDisabled = false,
  onHoldToTalkStart,
  onHoldToTalkEnd,
  onCancelVoiceInput,
}: AnalysisStagePanelProps) {
  const showCompactStage = mobileCompact && !mobileCompactExpanded

  return (
    <section
      className={cn(
        'pointer-events-auto relative flex h-full min-h-0 flex-1 flex-col overflow-hidden rounded-[2rem] border border-white/80 bg-white/62 shadow-xl shadow-slate-900/8 backdrop-blur-xl',
        showCompactStage ? 'max-lg:min-h-0' : 'min-h-[34rem] xl:min-h-0',
      )}
    >
      <div
        className={cn(
          'relative flex-1',
          showCompactStage ? 'max-lg:min-h-[7rem] max-lg:max-h-[7rem]' : 'min-h-[18rem]',
        )}
      >
        {showCompactStage ? (
          <AnalysisStageCanvasFallback variant="idle" />
        ) : (
          <>
            <AnalysisStageCanvas />
            <div
              className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-white/64 via-white/34 to-white/72"
              aria-hidden
            />
          </>
        )}
        <div className="pointer-events-auto absolute inset-x-0 top-0 z-20 px-4 py-2.5">
          <AnalysisStageStatusBar appState={appState} analysisFlow={analysisFlow} />
        </div>
        {mobileCompact && onToggleMobileCompact ? (
          <div className="pointer-events-auto absolute left-3 top-3 z-20 max-lg:block lg:hidden">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 rounded-full border-white/85 bg-white/94 px-2.5 text-[11px] shadow-sm backdrop-blur-md hover:bg-white"
              onClick={onToggleMobileCompact}
              aria-expanded={mobileCompactExpanded}
            >
              {mobileCompactExpanded ? (
                <>
                  <ChevronDown className="mr-1 h-3.5 w-3.5" aria-hidden />
                  收起舞台
                </>
              ) : (
                <>
                  <ChevronUp className="mr-1 h-3.5 w-3.5" aria-hidden />
                  展开舞台
                </>
              )}
            </Button>
          </div>
        ) : null}
        {!showCompactStage ? (
          <StageVoiceFab
            appState={appState}
            disabled={voiceFabDisabled}
            onHoldToTalkStart={onHoldToTalkStart}
            onHoldToTalkEnd={onHoldToTalkEnd}
            onHoldToTalkCancel={onCancelVoiceInput}
          />
        ) : null}
      </div>
    </section>
  )
}
