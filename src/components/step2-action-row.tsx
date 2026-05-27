import { STEP2_COPY } from '@/shared/ui-copy'

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
    <div className="flex flex-wrap items-center gap-2 px-3 pb-2">
      {quickReplies.map((reply) => (
        <button
          key={reply}
          type="button"
          onClick={() => onQuickReply(reply)}
          className="rounded-full border border-primary/15 bg-primary/[0.06] px-3 py-1.5 text-[11px] font-semibold text-primary transition-colors hover:bg-primary/10"
        >
          {reply}
        </button>
      ))}
      {showSkip ? (
        <button
          type="button"
          onClick={onSkipRecommendation}
          className="text-[11px] font-semibold text-foreground/55 underline-offset-2 transition-colors hover:text-foreground/80 hover:underline"
        >
          {STEP2_COPY.skipLabel}
        </button>
      ) : null}
    </div>
  )
}
