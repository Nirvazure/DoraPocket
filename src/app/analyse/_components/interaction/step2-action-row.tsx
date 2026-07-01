export type Step2ActionRowProps = {
  quickReplies: string[]
  onQuickReply: (text: string) => void
}

export function Step2ActionRow({ quickReplies, onQuickReply }: Step2ActionRowProps) {
  if (quickReplies.length === 0) return null

  return (
    <div className="space-y-2 px-3 pb-2">
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
    </div>
  )
}
