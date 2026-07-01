import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { AgentCandidate } from '@/shared/market-types'

function hubSubLabel(sourceLabel: AgentCandidate['sourceLabel']): string | null {
  if (sourceLabel === 'pocket') return '口袋'
  if (sourceLabel === 'market') return '市场'
  return null
}

type CandidateOriginBadgeProps = {
  candidate: Pick<AgentCandidate, 'sourceLabel' | 'candidateType'>
  className?: string
  variant?: 'default' | 'on-dark'
}

export function CandidateOriginBadge({
  candidate,
  className,
  variant = 'default',
}: CandidateOriginBadgeProps) {
  const isExternal =
    candidate.candidateType === 'external_suggestion' || candidate.sourceLabel === 'external'

  if (isExternal) {
    return (
      <Badge
        variant="outline"
        className={cn(
          variant === 'on-dark'
            ? 'border-amber-200/35 bg-amber-500/15 px-2.5 py-0.5 text-[10px] font-semibold text-amber-100'
            : 'border-amber-300/80 bg-amber-50 px-2.5 py-0.5 text-[10px] font-semibold text-amber-900',
          className,
        )}
      >
        Hub 外
      </Badge>
    )
  }

  const sub = hubSubLabel(candidate.sourceLabel)
  return (
    <Badge
      variant="outline"
      className={cn(
        variant === 'on-dark'
          ? 'border-sky-200/30 bg-sky-400/15 px-2.5 py-0.5 text-[10px] font-semibold text-sky-100'
          : 'border-sky-200/80 bg-sky-50 px-2.5 py-0.5 text-[10px] font-semibold text-sky-800',
        className,
      )}
    >
      Tool Hub{sub ? ` · ${sub}` : ''}
    </Badge>
  )
}
