'use client'

import dynamic from 'next/dynamic'
import type { AnalysisFlow } from '@/components/discovery/analysis-stage-content'
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
import { modeImageSrc, type AssistantModeCard } from '@/shared/mode-registry'
import type { AppState } from '@/store'
import { ChevronDown, ChevronUp, Sparkles } from 'lucide-react'
import Image from 'next/image'

type ToolDialMode = 'quick' | 'all'

type AnalysisStagePanelProps = {
  appState: AppState
  analysisFlow: AnalysisFlow
  toolDialRef: React.RefObject<HTMLElement | null>
  toolDialOpen: boolean
  toolDialMode: ToolDialMode
  selectedGadgetKey: string | null
  dialGadgets: AssistantModeCard[]
  onToggleToolDial: () => void
  onSelectDialGadget: (gadget: AssistantModeCard) => void
  onToggleToolDialMode: () => void
  onOpenQuickSettings: () => void
  mobileCompact?: boolean
  mobileCompactExpanded?: boolean
  onToggleMobileCompact?: () => void
  children?: React.ReactNode
}

function ToolDialMenu({
  toolDialMode,
  selectedGadgetKey,
  dialGadgets,
  onSelectDialGadget,
  onToggleToolDialMode,
}: {
  toolDialMode: ToolDialMode
  selectedGadgetKey: string | null
  dialGadgets: AssistantModeCard[]
  onSelectDialGadget: (gadget: AssistantModeCard) => void
  onToggleToolDialMode: () => void
}) {
  return (
    <div
      role="menu"
      aria-label="内置道具拨盘"
      className="absolute bottom-14 right-0 z-10 w-56 rounded-2xl border border-white/85 bg-white/95 p-2 shadow-md"
    >
      <div className="grid grid-cols-1 gap-1.5">
        {dialGadgets.map((gadget) => {
          const selected = selectedGadgetKey != null && gadget.selectKey === selectedGadgetKey
          return (
            <button
              key={gadget.title}
              role="menuitem"
              type="button"
              className={cn(
                'flex items-center gap-2 rounded-full border px-2.5 py-1.5 text-[11px] font-semibold',
                selected
                  ? 'border-primary bg-primary/12 text-primary'
                  : 'border-white/85 bg-white text-foreground hover:bg-slate-50',
              )}
              onClick={() => onSelectDialGadget(gadget)}
            >
              <Image
                src={modeImageSrc(gadget)}
                alt=""
                width={16}
                height={16}
                className="h-4 w-4 rounded-full object-contain"
              />
              <span className="truncate">{gadget.title}</span>
            </button>
          )
        })}
        <button
          role="menuitem"
          type="button"
          className="rounded-full border border-white/85 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-foreground hover:bg-slate-50"
          onClick={onToggleToolDialMode}
        >
          {toolDialMode === 'quick' ? '更多道具' : '收起道具'}
        </button>
      </div>
    </div>
  )
}

export function AnalysisStagePanel({
  appState,
  analysisFlow,
  toolDialRef,
  toolDialOpen,
  toolDialMode,
  selectedGadgetKey,
  dialGadgets,
  onToggleToolDial,
  onSelectDialGadget,
  onToggleToolDialMode,
  onOpenQuickSettings,
  mobileCompact = false,
  mobileCompactExpanded = false,
  onToggleMobileCompact,
  children,
}: AnalysisStagePanelProps) {
  const showCompactStage = mobileCompact && !mobileCompactExpanded

  return (
    <section
      ref={toolDialRef}
      className={cn(
        'pointer-events-auto relative flex h-full min-h-0 flex-1 flex-col overflow-hidden rounded-[2rem] border border-white/80 bg-white/62 shadow-xl shadow-slate-900/8 backdrop-blur-xl',
        showCompactStage ? 'max-lg:min-h-0' : 'min-h-[34rem] xl:min-h-0',
      )}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-20 rounded-t-[2rem] bg-white/92"
        aria-hidden
      />
      <div className="relative z-10 shrink-0 border-b border-border/45 bg-white/90 px-4 py-2.5 backdrop-blur-md">
        <AnalysisStageStatusBar
          appState={appState}
          analysisFlow={analysisFlow}
          onOpenQuickSettings={onOpenQuickSettings}
        />
      </div>

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
        <div className="pointer-events-auto absolute bottom-3 right-3 z-20">
          <div className="relative">
            <Button
              type="button"
              variant="outline"
              className="h-11 w-11 rounded-full border-white/85 bg-white/94 p-0 text-xs shadow-lg shadow-slate-900/10 backdrop-blur-md hover:bg-white"
              onClick={onToggleToolDial}
              aria-expanded={toolDialOpen}
              aria-label="打开内置道具拨盘"
            >
              <Sparkles className="h-4 w-4" />
            </Button>
            {toolDialOpen ? (
              <ToolDialMenu
                toolDialMode={toolDialMode}
                selectedGadgetKey={selectedGadgetKey}
                dialGadgets={dialGadgets}
                onSelectDialGadget={onSelectDialGadget}
                onToggleToolDialMode={onToggleToolDialMode}
              />
            ) : null}
          </div>
        </div>
      </div>

      {children}
    </section>
  )
}
