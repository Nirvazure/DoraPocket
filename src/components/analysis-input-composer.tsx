import { Keyboard, Mic, Square } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { AppState } from '@/store'

type InputMode = 'text' | 'voice'

type AnalysisInputComposerProps = {
  appState: AppState
  inputMode: InputMode
  textFallback: string
  canSendText: boolean
  locked: boolean
  placeholder: string
  onToggleInputMode: () => void
  onTextChange: (value: string) => void
  onSubmit: () => void
  onHoldToTalkStart: () => void
  onHoldToTalkEnd: () => void
  onCancelVoiceInput?: () => void
  onInteractionStart?: () => void
}

export function AnalysisInputComposer({
  appState,
  inputMode,
  textFallback,
  canSendText,
  locked,
  placeholder,
  onToggleInputMode,
  onTextChange,
  onSubmit,
  onHoldToTalkStart,
  onHoldToTalkEnd,
  onCancelVoiceInput,
  onInteractionStart,
}: AnalysisInputComposerProps) {
  return (
    <div
      data-dorapocket-textbox
      data-dorapocket-ui
      className="relative z-10 shrink-0 pointer-events-auto border-t border-white/60 bg-white/78 p-2.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur-md sm:p-3"
    >
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          type="button"
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/80 bg-white/92 text-foreground shadow-sm transition-colors hover:bg-white"
          onClick={() => {
            onInteractionStart?.()
            onToggleInputMode()
          }}
          aria-label={inputMode === 'text' ? '切换到语音输入' : '切换到文字输入'}
          title={inputMode === 'text' ? '切换到语音输入' : '切换到文字输入'}
        >
          {inputMode === 'text' ? <Mic className="h-4 w-4" /> : <Keyboard className="h-4 w-4" />}
        </button>

        {inputMode === 'text' ? (
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-2xl border border-white/80 bg-white/95 p-1.5 shadow-sm backdrop-blur-md">
            <input
              type="text"
              value={textFallback}
              onChange={(event) => {
                onInteractionStart?.()
                onTextChange(event.target.value)
              }}
              onFocus={() => onInteractionStart?.()}
              placeholder={placeholder}
              disabled={locked}
              className="min-w-0 flex-1 rounded-full border border-border/70 bg-transparent px-3 py-2 font-sans text-sm text-foreground outline-none ring-primary/30 placeholder:text-muted-foreground focus-visible:ring-2"
              onKeyDown={(event) => {
                if (event.key === 'Enter' && canSendText && !locked) onSubmit()
              }}
            />
            <Button
              type="button"
              disabled={!canSendText || locked}
              className="h-10 shrink-0 rounded-full border-2 border-primary/25 px-4 font-sans text-xs font-semibold shadow-sm disabled:cursor-not-allowed disabled:opacity-45"
              onClick={onSubmit}
            >
              发送
            </Button>
          </div>
        ) : (
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <button
              type="button"
              disabled={locked}
              className={cn(
                'flex h-11 min-w-0 flex-1 items-center justify-center rounded-2xl border px-4 font-sans text-sm font-semibold backdrop-blur-md transition-colors',
                appState === 'listening'
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-white/70 bg-white/90 text-foreground hover:bg-white',
                locked && 'cursor-not-allowed opacity-55',
              )}
              onPointerDown={() => {
                onInteractionStart?.()
                onHoldToTalkStart()
              }}
              onPointerUp={onHoldToTalkEnd}
              onPointerLeave={onHoldToTalkEnd}
              onPointerCancel={onHoldToTalkEnd}
            >
              {appState === 'listening' ? '松开结束' : '按住说话'}
            </button>
            {appState === 'listening' ? (
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-11 w-11 shrink-0 rounded-full border-border/70 bg-white"
                onClick={() => {
                  onInteractionStart?.()
                  onCancelVoiceInput?.()
                }}
                aria-label="停止录音"
                title="停止录音"
              >
                <Square className="h-4 w-4" />
              </Button>
            ) : null}
          </div>
        )}
      </div>
    </div>
  )
}
