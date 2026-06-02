'use client'

import { Archive } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PAGE_COPY } from '@/shared/ui-copy'

type MarketUnavailableToolCardProps = {
  toolId: string
  onRemove: (toolId: string) => void
}

export function MarketUnavailableToolCard({ toolId, onRemove }: MarketUnavailableToolCardProps) {
  return (
    <article className="flex min-h-40 flex-col rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50/90 p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-400">
          <Archive className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-sm font-bold text-slate-900">
            {PAGE_COPY.market.unavailableToolTitle}
          </p>
          <p className="text-xs leading-relaxed text-slate-600">
            {PAGE_COPY.market.unavailableToolDescription}
          </p>
          <p className="truncate font-mono text-[10px] text-slate-400">{toolId}</p>
        </div>
      </div>
      <Button
        type="button"
        variant="outline"
        className="mt-4 h-9 w-full rounded-full text-xs font-semibold"
        onClick={() => onRemove(toolId)}
      >
        {PAGE_COPY.market.removeUnavailableAction}
      </Button>
    </article>
  )
}
