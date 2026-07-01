import { VolumeX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { AppState } from '@/store'

type DoraVoicePlaybackBarProps = {
  appState: AppState
  botResponse: string
  canSkip: boolean
  onSkip: () => void
}

export function DoraVoicePlaybackBar({
  appState,
  botResponse,
  canSkip,
  onSkip,
}: DoraVoicePlaybackBarProps) {
  const text = botResponse.trim()
  if (appState !== 'speaking' || !text) return null

  return (
    <div
      data-dorapocket-voice-bar
      data-dorapocket-ui
      className="relative z-10 shrink-0 border-t border-white/60 bg-white/78 p-2.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur-md sm:p-3"
      aria-live="polite"
    >
      <div className="rounded-2xl border border-white/85 bg-white/95 p-3 shadow-sm backdrop-blur-md">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span
                className="h-2 w-2 shrink-0 rounded-full bg-primary motion-safe:animate-pulse"
                aria-hidden
              />
              <p className="text-xs font-semibold text-primary">Dora 正在说</p>
            </div>
            <div className="mt-2 max-h-20 overflow-y-auto pr-1 text-sm font-semibold leading-7 text-foreground/82">
              {text}
            </div>
          </div>
          {canSkip ? (
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              className="shrink-0 rounded-full border-border/70 bg-white"
              onClick={onSkip}
              aria-label="停止语音并直接揭晓"
              title="停止语音并直接揭晓"
            >
              <VolumeX className="h-4 w-4" />
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
