'use client'

import { Settings } from 'lucide-react'
import type { AnalysisFlow } from '@/components/discovery/analysis-stage-content'
import { RightStatusShowcase } from '@/components/right-status-showcase'
import { Button } from '@/components/ui/button'
import type { AppState } from '@/store'

type AnalysisStageStatusBarProps = {
  appState: AppState
  analysisFlow: AnalysisFlow
  onOpenQuickSettings: () => void
}

export function AnalysisStageStatusBar({
  appState,
  analysisFlow,
  onOpenQuickSettings,
}: AnalysisStageStatusBarProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <RightStatusShowcase appState={appState} analysisFlow={analysisFlow} />
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-9 w-9 shrink-0 rounded-full border-border/60 bg-white/90 text-slate-600 shadow-sm hover:bg-white hover:text-slate-950"
        onClick={onOpenQuickSettings}
        aria-label="打开快捷设置"
        title="快捷设置"
      >
        <Settings className="h-4 w-4" />
      </Button>
    </div>
  )
}
