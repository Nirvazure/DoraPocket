import { Keyboard, Mic } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { AppState } from '@/store'

type InputMode = 'text' | 'voice'

type AnalysisInputComposerProps = {
  appState: AppState
  inputMode: InputMode
  textFallback: string
  starterDraftReady: boolean
  canSendText: boolean
  placeholder: string
  onToggleInputMode: () => void
  onTextChange: (value: string) => void
  onSubmit: () => void
  onDismissDraft: () => void
  onHoldToTalkStart: () => void
  onHoldToTalkEnd: () => void
}

export function AnalysisInputComposer({
  appState,
  inputMode,
  textFallback,
  starterDraftReady,
  canSendText,
  placeholder,
  onToggleInputMode,
  onTextChange,
  onSubmit,
  onDismissDraft,
  onHoldToTalkStart,
  onHoldToTalkEnd,
}: AnalysisInputComposerProps) {
  return (
    <div
      data-dorapocket-textbox
      data-dorapocket-ui
      className="relative z-10 shrink-0 pointer-events-auto border-t border-white/60 bg-white/78 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md"
    >
      <div className="space-y-2">
        {starterDraftReady && textFallback.trim() ? (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-primary/20 bg-primary/[0.06] px-3 py-2 text-xs text-foreground shadow-sm">
            <span className="font-semibold text-foreground/80">
              已填入任务草稿，可以直接开始裁决，也可以继续修改。
            </span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                className="h-8 rounded-full px-3 text-[11px] font-bold"
                onClick={onSubmit}
              >
                直接开始
              </Button>
              <button
                type="button"
                className="rounded-full px-2 py-1 text-[11px] font-semibold text-muted-foreground transition-colors hover:bg-white/70 hover:text-foreground"
                onClick={onDismissDraft}
              >
                关闭
              </button>
            </div>
          </div>
        ) : null}

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/80 bg-white/92 text-foreground shadow-sm transition-colors hover:bg-white"
            onClick={onToggleInputMode}
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
                onChange={(event) => onTextChange(event.target.value)}
                placeholder={placeholder}
                className="min-w-0 flex-1 rounded-full border border-border/70 bg-transparent px-3 py-2 font-sans text-sm text-foreground outline-none ring-primary/30 placeholder:text-muted-foreground focus-visible:ring-2"
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && canSendText) onSubmit()
                }}
              />
              <Button
                type="button"
                disabled={!canSendText}
                className="h-10 shrink-0 rounded-full border-2 border-primary/25 px-4 font-sans text-xs font-semibold shadow-sm disabled:cursor-not-allowed disabled:opacity-45"
                onClick={onSubmit}
              >
                发送
              </Button>
            </div>
          ) : (
            <button
              type="button"
              className={cn(
                'flex h-11 min-w-0 flex-1 items-center justify-center rounded-2xl border px-4 font-sans text-sm font-semibold backdrop-blur-md transition-colors',
                appState === 'listening'
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-white/70 bg-white/90 text-foreground hover:bg-white',
              )}
              onPointerDown={onHoldToTalkStart}
              onPointerUp={onHoldToTalkEnd}
              onPointerLeave={onHoldToTalkEnd}
              onPointerCancel={onHoldToTalkEnd}
            >
              {appState === 'listening' ? '松开结束' : '按住说话'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
