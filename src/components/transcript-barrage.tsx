import { cn } from '@/lib/utils'

type Props = { text: string }

/** 左下角：浅色底 + 黑色字（使用全局 font-sans = 预设 C：Quicksand + Noto Sans SC） */
export function TranscriptBarrage({ text }: Props) {
  const t = text.trim()
  if (!t) return null

  return (
    <div
      className="pointer-events-none absolute bottom-24 left-4 z-[6] max-w-[min(80vw,280px)]"
      aria-hidden
    >
      <p
        key={t.slice(0, 64) + t.length}
        className={cn(
          'rounded-full border border-white/85 bg-white/92 px-3 py-2 shadow-sm backdrop-blur-sm',
          'text-left font-sans text-[11px] font-medium leading-snug text-foreground/76',
          'motion-safe:animate-dp-danmaku-in',
          'line-clamp-2 break-words',
        )}
      >
        {t}
      </p>
    </div>
  )
}
