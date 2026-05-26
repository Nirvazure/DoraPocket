import type { AppState } from '@/store'

type DoraSpeechBubbleProps = {
  appState: AppState
  currentPrompt: string | null
  botResponse: string
  hasResult: boolean
}

function resolveBubbleText({ appState, botResponse }: DoraSpeechBubbleProps) {
  const response = botResponse.trim()
  if (appState === 'speaking' && response) {
    return {
      label: 'Dora 正在说',
      text: response,
      expanded: true,
    }
  }

  return null
}

export function DoraSpeechBubble(props: DoraSpeechBubbleProps) {
  const content = resolveBubbleText(props)
  if (!content) return null

  return (
    <div className="pointer-events-auto absolute inset-x-4 top-4 z-20 max-h-40 rounded-[1.35rem] border border-white/85 bg-white/88 p-3 text-left shadow-lg shadow-slate-900/10 backdrop-blur-xl transition-all duration-300">
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 shrink-0 rounded-full bg-primary" aria-hidden />
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
          {content.label}
        </p>
      </div>
      <div className="mt-2 max-h-24 overflow-y-auto pr-1 text-sm font-semibold leading-7 text-foreground/82">
        {content.text}
      </div>
    </div>
  )
}
