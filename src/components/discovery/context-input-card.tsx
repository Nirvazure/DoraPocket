import { MessageSquarePlus } from 'lucide-react'
import type { AgentUiPayload } from '@/shared/market-types'

type ContextInputCardProps = {
  payload: AgentUiPayload | null
}

export function ContextInputCard({ payload }: ContextInputCardProps) {
  const missingInputs = payload?.taskFrame.missingInputs ?? []
  if (missingInputs.length === 0) {
    return (
      <section className="rounded-3xl border border-dashed border-border/70 bg-white/60 p-4">
        <p className="text-xs font-semibold text-muted-foreground">当前裁决已经够用；如果你想更精准，再补充预算、登录限制或中文体验偏好。</p>
      </section>
    )
  }

  return (
    <section className="rounded-3xl border border-primary/15 bg-primary/[0.04] p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-primary">
          <MessageSquarePlus className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-black text-foreground">补充这些条件，裁决会更准</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {missingInputs.length > 0 ? missingInputs.join('、') : '例如预算、是否能登录、是否要中文体验、是否需要引用来源。'}
          </p>
        </div>
      </div>
    </section>
  )
}
