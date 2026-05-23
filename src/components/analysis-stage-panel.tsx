import type { AnalysisStage } from '@/components/discovery/analysis-stage-content'
import { PackageOpen, Sparkles, VolumeX } from 'lucide-react'
import Image from 'next/image'
import { AnalysisStageCanvas } from '@/components/analysis-stage-canvas'
import { DoraSpeechBubble } from '@/components/dora-speech-bubble'
import { RightStatusShowcase } from '@/components/right-status-showcase'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { modeImageSrc, type AssistantModeCard } from '@/shared/mode-registry'
import type { AppState } from '@/store'

type ToolDialMode = 'quick' | 'all'

type AnalysisStagePanelProps = {
  appState: AppState
  analysisStage: AnalysisStage
  toolDialRef: React.RefObject<HTMLElement | null>
  toolDialOpen: boolean
  toolDialMode: ToolDialMode
  selectedGadgetKey: string | null
  dialGadgets: AssistantModeCard[]
  currentPrompt: string | null
  botResponse: string
  hasResult: boolean
  onToggleToolDial: () => void
  onSelectDialGadget: (gadget: AssistantModeCard) => void
  onToggleToolDialMode: () => void
  canSkipVoice: boolean
  onRevealNow: () => void
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
  analysisStage,
  toolDialRef,
  toolDialOpen,
  toolDialMode,
  selectedGadgetKey,
  dialGadgets,
  currentPrompt,
  botResponse,
  hasResult,
  onToggleToolDial,
  onSelectDialGadget,
  onToggleToolDialMode,
  canSkipVoice,
  onRevealNow,
  children,
}: AnalysisStagePanelProps) {
  const showPocketStage =
    analysisStage === 'judging' || analysisStage === 'covered' || analysisStage === 'revealing'

  return (
    <section
      ref={toolDialRef}
      className="pointer-events-auto relative flex h-full min-h-[34rem] flex-col overflow-hidden rounded-[2rem] border border-white/80 bg-white/62 shadow-xl shadow-slate-900/8 backdrop-blur-xl xl:min-h-0"
    >
      <div
        className="absolute inset-x-0 top-0 z-[1] h-20 rounded-t-[2rem] bg-white/92"
        aria-hidden
      />
      <div className="relative z-10 shrink-0 border-b border-border/45 bg-white/90 px-4 py-2.5 backdrop-blur-md">
        <div className="flex items-center justify-between gap-3">
          <RightStatusShowcase appState={appState} analysisStage={analysisStage} />
        </div>
      </div>

      <div className="relative min-h-0 flex-1">
        <AnalysisStageCanvas />
        <div
          className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-white/64 via-white/34 to-white/72"
          aria-hidden
        />
        <DoraSpeechBubble
          appState={appState}
          analysisStage={analysisStage}
          currentPrompt={currentPrompt}
          botResponse={botResponse}
          hasResult={hasResult}
        />
        {showPocketStage ? (
          <div className="pointer-events-none absolute inset-x-5 bottom-24 z-20 flex justify-center">
            <div
              className={cn(
                'relative flex min-w-[12rem] items-center gap-3 rounded-[1.35rem] border border-white/85 bg-white/86 px-4 py-3 shadow-xl shadow-slate-900/10 backdrop-blur-md',
                analysisStage === 'revealing' && 'animate-dp-tab-pop',
              )}
            >
              <span className="relative flex h-12 w-12 shrink-0 items-center justify-center">
                <span className="absolute inset-0 rounded-full bg-sky-100 motion-safe:animate-pulse" />
                <Image
                  src="/images/pocket.png"
                  alt=""
                  width={48}
                  height={48}
                  className="relative h-11 w-11 object-contain drop-shadow-sm"
                />
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="text-xs font-black text-slate-950">
                  {analysisStage === 'revealing' ? '出手' : '翻口袋中'}
                </span>
                <span className="mt-1 inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-600">
                  <PackageOpen className="h-3.5 w-3.5 text-sky-600" />
                  {analysisStage === 'covered' ? '已经摸到一个合适的道具' : '正在收敛方向'}
                </span>
              </span>
            </div>
          </div>
        ) : null}
        <div className="pointer-events-none relative z-10 min-h-0 flex-1" />
        {canSkipVoice ? (
          <Button
            type="button"
            variant="outline"
            className="pointer-events-auto absolute right-3 top-3 z-30 h-10 w-10 rounded-full border-white/85 bg-white/94 p-0 text-slate-700 shadow-lg shadow-slate-900/10 backdrop-blur-md hover:bg-white"
            onClick={onRevealNow}
            aria-label="停止语音并直接揭晓"
            title="停止语音并直接揭晓"
          >
            <VolumeX className="h-4 w-4" />
          </Button>
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
