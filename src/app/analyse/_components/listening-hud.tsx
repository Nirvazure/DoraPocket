/**
 * 纯视觉聆听指示，pointer-events-none，不采集麦克风。
 */
export function ListeningHud() {
  return (
    <div className="pointer-events-none absolute bottom-28 right-5 z-[5] md:bottom-32" aria-hidden>
      <div className="flex items-center gap-2 rounded-full border border-white/70 bg-white/88 px-3 py-2 shadow-lg backdrop-blur-md">
        <div className="relative flex h-6 w-6 items-center justify-center">
          <span className="absolute inline-flex h-full w-full rounded-full border border-primary/45 motion-safe:animate-dp-listen-ring" />
          <span className="absolute h-2 w-2 rounded-full bg-dora-red shadow-[0_0_14px_hsl(var(--primary)/0.55)] motion-safe:animate-dp-listen-core" />
        </div>
        <span className="text-[11px] font-semibold text-foreground/80">语音输入中</span>
      </div>
    </div>
  )
}
