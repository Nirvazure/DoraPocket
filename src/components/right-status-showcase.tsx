import { cn } from '@/lib/utils'
import type { AppState } from '@/store'

type RightStatusShowcaseProps = {
  appState: AppState
}

type StatusCopy = {
  label: string
  toneClassName: string
}

const STATUS_COPY: Record<AppState, StatusCopy> = {
  idle: {
    label: '哆啦待命中',
    toneClassName: 'bg-sky-500/80',
  },
  listening: {
    label: '哆啦聆听中',
    toneClassName: 'bg-cyan-500/85',
  },
  thinking: {
    label: '哆啦思考中',
    toneClassName: 'bg-primary',
  },
  speaking: {
    label: '哆啦回应中',
    toneClassName: 'bg-primary',
  },
}

export function RightStatusShowcase({ appState }: RightStatusShowcaseProps) {
  const current = STATUS_COPY[appState]
  const showLoadingDots = appState === 'thinking' || appState === 'speaking'

  return (
    <div className="pointer-events-none inline-flex max-w-full items-center justify-end gap-2 text-right">
      <span className={cn('h-2 w-2 shrink-0 rounded-full', current.toneClassName)} aria-hidden />
      <span className="truncate text-[11px] font-bold tracking-[0.18em] text-foreground/86">{current.label}</span>
      {showLoadingDots ? (
        <span className="inline-flex items-center gap-1 self-center" aria-hidden>
          <span className="animate-dp-thinking-dot inline-block h-1.5 w-1.5 rounded-full bg-primary" />
          <span className="animate-dp-thinking-dot inline-block h-1.5 w-1.5 rounded-full bg-primary" />
          <span className="animate-dp-thinking-dot inline-block h-1.5 w-1.5 rounded-full bg-primary" />
        </span>
      ) : null}
    </div>
  )
}
