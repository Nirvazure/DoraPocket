import { STEP2_COPY } from '@/shared/ui-copy'
import { Sparkles } from 'lucide-react'

export type Step2ActionRowProps = {
  quickReplies: string[]
  showSkip: boolean
  onQuickReply: (text: string) => void
  onSkipRecommendation: () => void
}

export function Step2ActionRow({
  quickReplies,
  showSkip,
  onQuickReply,
  onSkipRecommendation,
}: Step2ActionRowProps) {
  if (quickReplies.length === 0 && !showSkip) return null

  return (
    <div className="space-y-2 px-3 pb-2">
      {showSkip ? (
        <button
          type="button"
          onClick={onSkipRecommendation}
          className="flex w-full items-center justify-center gap-1.5 rounded-full border border-primary/25 bg-primary/[0.08] px-3 py-2 text-[11px] font-semibold text-primary shadow-sm transition-colors hover:bg-primary/12"
        >
          <Sparkles className="h-3.5 w-3.5" aria-hidden />
          {STEP2_COPY.skipLabel}
        </button>
      ) : null}
      {quickReplies.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          {quickReplies.map((reply) => (
            <button
              key={reply}
              type="button"
              onClick={() => onQuickReply(reply)}
              className="rounded-full border border-border/60 bg-white px-3 py-1.5 text-[11px] font-semibold text-foreground/80 transition-colors hover:bg-slate-50"
            >
              {reply}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
