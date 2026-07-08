'use client'

import { CheckCircle2, ThumbsDown, Wand2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSaveRecommendationEvaluationMutation } from '@/lib/query/recommendation-evaluation'
import type { RecommendationEvaluationTag } from '@/shared/discovery/recommendation-evaluation'

type RecommendationEvaluationBarProps = {
  recommendationSessionId: string | null
  selectedToolId?: string | null
}

export function RecommendationEvaluationBar({
  recommendationSessionId,
  selectedToolId = null,
}: RecommendationEvaluationBarProps) {
  const mutation = useSaveRecommendationEvaluationMutation()
  if (!recommendationSessionId) return null

  const submit = (input: {
    helpful: boolean | null
    tried?: boolean
    outcome: 'helpful' | 'not_helpful' | 'tried'
    rating?: 1 | 2 | 3 | 4 | 5
    tags: RecommendationEvaluationTag[]
  }) => {
    mutation.mutate({
      recommendationSessionId,
      selectedToolId,
      opened: true,
      helpful: input.helpful,
      tried: input.tried ?? false,
      outcome: input.outcome,
      rating: input.rating,
      tags: input.tags,
    })
  }

  return (
    <div className="flex w-full flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-white/8 px-3 py-2 text-xs text-white/78">
      <span className="mr-auto font-bold text-white">这次推荐准吗？</span>
      <Button
        type="button"
        size="sm"
        className="h-8 rounded-full bg-white px-3 text-[11px] font-bold text-slate-950 hover:bg-white/90"
        disabled={mutation.isPending}
        onClick={() =>
          submit({
            helpful: true,
            tried: true,
            outcome: 'helpful',
            rating: 5,
            tags: ['matched_task', 'fast_to_start'],
          })
        }
      >
        <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
        有用
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="h-8 rounded-full border-white/20 bg-white/10 px-3 text-[11px] font-bold text-white hover:bg-white/16"
        disabled={mutation.isPending}
        onClick={() =>
          submit({
            helpful: false,
            outcome: 'not_helpful',
            rating: 2,
            tags: ['not_enough_context'],
          })
        }
      >
        <ThumbsDown className="mr-1 h-3.5 w-3.5" />
        不太对
      </Button>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        className="h-8 rounded-full px-3 text-[11px] font-bold text-white hover:bg-white/10"
        disabled={mutation.isPending}
        onClick={() =>
          submit({
            helpful: null,
            tried: true,
            outcome: 'tried',
            tags: ['fast_to_start'],
          })
        }
      >
        <Wand2 className="mr-1 h-3.5 w-3.5" />
        我试过了
      </Button>
    </div>
  )
}
