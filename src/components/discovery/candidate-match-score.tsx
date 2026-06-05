import { getCandidateScoreValue } from '@/components/discovery/candidate-score'
import type { AgentCandidate } from '@/shared/market-types'
import { cn } from '@/lib/utils'

type CandidateMatchScoreProps = {
  candidate: AgentCandidate
  layout?: 'inline' | 'chip' | 'pillar' | 'hero'
  tone?: 'light' | 'dark'
  className?: string
}

export function CandidateMatchScore({
  candidate,
  layout = 'inline',
  tone = 'light',
  className,
}: CandidateMatchScoreProps) {
  const value = getCandidateScoreValue(candidate)
  const isDark = tone === 'dark'

  if (layout === 'pillar') {
    return (
      <div
        className={cn('dp-match-score-pillar tabular-nums', className)}
        role="img"
        aria-label={`匹配度 ${value}`}
      >
        <span className="dp-match-score-pillar-value">{value}</span>
        <span className="dp-match-score-pillar-label">匹配</span>
      </div>
    )
  }

  if (layout === 'hero') {
    return (
      <div
        className={cn(
          'dp-match-score-hero tabular-nums',
          isDark && 'dp-match-score-hero-dark',
          className,
        )}
        role="img"
        aria-label={`匹配度 ${value}`}
      >
        <span className="dp-match-score-hero-value">{value}</span>
        <span className="dp-match-score-hero-label">匹配</span>
      </div>
    )
  }

  if (layout === 'chip') {
    return (
      <div
        className={cn(
          'dp-match-score-chip tabular-nums',
          isDark && 'dp-match-score-chip-dark',
          className,
        )}
        role="img"
        aria-label={`匹配度 ${value}`}
      >
        <span className="dp-match-score-chip-value">{value}</span>
        <span className="dp-match-score-chip-label">匹配</span>
      </div>
    )
  }

  return (
    <div
      className={cn('dp-match-score-inline tabular-nums', className)}
      role="img"
      aria-label={`匹配度 ${value}`}
    >
      <span
        className={cn('text-lg font-black leading-none', isDark ? 'text-white' : 'text-primary')}
      >
        {value}
      </span>
      <span
        className={cn(
          'text-[10px] font-semibold leading-none',
          isDark ? 'text-white/55' : 'text-muted-foreground',
        )}
      >
        匹配
      </span>
    </div>
  )
}
