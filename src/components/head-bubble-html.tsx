import { Html } from '@react-three/drei'
import { useStore } from '@/store'
import { cn } from '@/lib/utils'

type Props = { position: [number, number, number] }

export function HeadBubbleHtml({ position }: Props) {
  const botResponse = useStore((s) => s.botResponse)
  const appState = useStore((s) => s.appState)

  if (appState === 'listening' || appState === 'idle') return null

  if (appState === 'thinking') {
    return (
      <group position={position}>
        <Html
          transform
          occlude={false}
          distanceFactor={2.55}
          center
          zIndexRange={[50, 0]}
          style={{ pointerEvents: 'none', userSelect: 'none' as const }}
        >
          <div
            role="status"
            aria-live="polite"
            aria-label="思考中"
            className={cn(
              'flex items-center gap-1.5 rounded-full border border-primary/30 bg-background/88 px-2 py-1 font-sans shadow-sm backdrop-blur-md',
              'motion-safe:animate-dp-bubble-in',
            )}
          >
            <span className="text-[8px] font-bold tabular-nums tracking-tight text-primary">正在裁决</span>
            <span className="flex items-center gap-0.5" aria-hidden>
              <span className="motion-safe:animate-dp-thinking-dot inline-block h-1 w-1 shrink-0 rounded-full bg-primary" />
              <span className="motion-safe:animate-dp-thinking-dot inline-block h-1 w-1 shrink-0 rounded-full bg-primary" />
              <span className="motion-safe:animate-dp-thinking-dot inline-block h-1 w-1 shrink-0 rounded-full bg-primary" />
            </span>
          </div>
        </Html>
      </group>
    )
  }

  const conciseBody = botResponse.trim().split(/[。！？\n]/).find(Boolean)?.trim() ?? ''
  const body = appState === 'speaking' ? conciseBody || '已给出结果' : ''
  if (!body) return null

  return (
    <group position={position}>
      <Html
        transform
        occlude={false}
        distanceFactor={3.35}
        center
        zIndexRange={[50, 0]}
        style={{ pointerEvents: 'none', userSelect: 'none' as const }}
      >
        <div className="relative w-[min(42vw,120px)] font-sans sm:w-[116px]">
          <div
            className={cn(
              'relative rounded-[10px] border border-slate-950/60 bg-[#fff8e7]/95 px-2 py-1 text-left shadow-sm',
              'motion-safe:animate-dp-bubble-in',
            )}
          >
            <p className="text-[7px] font-black uppercase tracking-[0.14em] text-slate-950/90 [text-shadow:0.5px_0_0_#fff]">
              哆啦
            </p>
            <p
              className="mt-0.5 max-h-[3rem] overflow-y-auto whitespace-pre-wrap pr-0.5 text-[8px] font-semibold leading-snug tracking-tight text-slate-950 [text-shadow:0.3px_0_0_#fff] sm:text-[8.5px]"
              style={{ wordBreak: 'break-word' }}
            >
              {body}
            </p>
          </div>
          <div className="absolute left-[38%] top-full -mt-[1px] -translate-x-1/2" aria-hidden>
            <div className="h-2 w-2 rotate-45 border-b border-r border-slate-950/60 bg-[#fff8e7]" />
          </div>
        </div>
      </Html>
    </group>
  )
}
