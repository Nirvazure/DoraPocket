'use client'

import type { AnalysisFlow } from '@/shared/analysis-stage-content'
import { RightStatusShowcase } from '@/components/right-status-showcase'
import type { AppState } from '@/store'

type AnalysisStageStatusBarProps = {
  appState: AppState
  analysisFlow: AnalysisFlow
}

export function AnalysisStageStatusBar({ appState, analysisFlow }: AnalysisStageStatusBarProps) {
  return <RightStatusShowcase appState={appState} analysisFlow={analysisFlow} />
}
