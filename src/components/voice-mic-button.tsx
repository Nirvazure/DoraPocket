import { AudioLines, CircleDot, Loader2, Mic } from 'lucide-react'
import type { AppState } from '@/store'
import { cn } from '@/lib/utils'

type VoiceMicButtonProps = {
  appState: AppState
  stateLabel: string
  onStartListen: () => void
  onStopListen: () => void
  onBusyPress: () => void
  /** 点击开始瞬间（早于 listening 提交），用于条带等反馈 */
  onArmingChange?: (armed: boolean) => void
}

/** 点击切换：第一次开始聆听，第二次结束并提交识别（桌面/触屏均用 click）。 */
export function VoiceMicButton({
  appState,
  stateLabel,
  onStartListen,
  onStopListen,
  onBusyPress,
  onArmingChange,
}: VoiceMicButtonProps) {
  const onClick = () => {
    if (appState === 'thinking' || appState === 'speaking') {
      onBusyPress()
      return
    }
    if (appState === 'idle') {
      onArmingChange?.(true)
      onStartListen()
      return
    }
    if (appState === 'listening') {
      onArmingChange?.(false)
      onStopListen()
    }
  }

  return (
    <button
      type="button"
      title="语音辅助输入"
      aria-label={`语音辅助输入：${stateLabel}`}
      aria-pressed={appState === 'listening'}
      className={cn(
        'flex h-full min-h-[2.75rem] w-[2.75rem] shrink-0 select-none flex-col items-center justify-center rounded-full border border-border/55 bg-white active:scale-[0.96] motion-safe:transition-transform sm:min-h-0 sm:w-[3.25rem]',
        appState === 'listening' &&
          'ring-2 ring-inset ring-primary/55 motion-safe:animate-pulse sm:ring-[3px]',
        (appState === 'thinking' || appState === 'speaking') && 'cursor-not-allowed opacity-90',
      )}
      onClick={onClick}
    >
      <VoiceMicGlyph appState={appState} />
    </button>
  )
}

function VoiceMicGlyph({ appState }: { appState: AppState }) {
  const iconClass = 'h-[1.125rem] w-[1.125rem] shrink-0 stroke-[2.25] sm:h-5 sm:w-5'
  switch (appState) {
    case 'idle':
      return <Mic className={cn(iconClass, 'text-muted-foreground')} aria-hidden />
    case 'listening':
      return <Mic className={cn(iconClass, 'text-primary motion-safe:animate-pulse')} aria-hidden />
    case 'thinking':
      return <Loader2 className={cn(iconClass, 'text-primary motion-safe:animate-spin')} aria-hidden />
    case 'speaking':
      return <AudioLines className={cn(iconClass, 'text-primary')} aria-hidden />
    default:
      return <CircleDot className={cn(iconClass, 'text-muted-foreground')} aria-hidden />
  }
}
