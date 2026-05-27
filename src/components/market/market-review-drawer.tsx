'use client'

import { useState } from 'react'
import { Star, ThumbsDown, ThumbsUp, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DisplayPanel,
  DisplayPanelContent,
  DisplayPanelDescription,
  DisplayPanelHeader,
  DisplayPanelTitle,
} from '@/components/ui/display-shell'
import type { MarketToolCardItem } from '@/hooks/use-market-page-model'
import {
  NEGATIVE_MARKET_REVIEW_TAGS,
  POSITIVE_MARKET_REVIEW_TAGS,
} from '@/shared/market-review-tags'
import type { MarketReviewTag, ToolVote } from '@/shared/market-types'
import { cn } from '@/lib/utils'
import { MARKET_ACTIVITY_COPY, PAGE_COPY } from '@/shared/ui-copy'

type MarketReviewDrawerProps = {
  open: boolean
  tool: MarketToolCardItem | null
  onClose: () => void
  onSubmit: (input: {
    toolId: string
    vote: ToolVote
    starRating: 1 | 2 | 3 | 4 | 5
    selectedTags: MarketReviewTag[]
  }) => void
}

const STAR_OPTIONS = [1, 2, 3, 4, 5] as const

function filterTagsByVote(
  vote: ToolVote | null,
  selectedTags: MarketReviewTag[],
): MarketReviewTag[] {
  if (!vote) return []
  const allowedTags: ReadonlySet<MarketReviewTag> =
    vote === 'up'
      ? new Set<MarketReviewTag>(POSITIVE_MARKET_REVIEW_TAGS)
      : new Set<MarketReviewTag>(NEGATIVE_MARKET_REVIEW_TAGS)
  return selectedTags.filter((tag) => allowedTags.has(tag))
}

export function MarketReviewDrawer({ open, tool, onClose, onSubmit }: MarketReviewDrawerProps) {
  const current = tool?.reviewAggregate?.currentUserReview ?? null
  const [vote, setVote] = useState<ToolVote | null>(current?.vote ?? null)
  const [starRating, setStarRating] = useState<1 | 2 | 3 | 4 | 5 | null>(
    current?.starRating ?? null,
  )
  const [selectedTags, setSelectedTags] = useState<MarketReviewTag[]>(current?.selectedTags ?? [])
  if (!open || !tool) return null

  const suggestedTags = vote === 'down' ? NEGATIVE_MARKET_REVIEW_TAGS : POSITIVE_MARKET_REVIEW_TAGS
  const canSubmit = Boolean(vote && starRating && selectedTags.length > 0)

  const handleVoteChange = (nextVote: ToolVote) => {
    setVote(nextVote)
    setSelectedTags((currentTags) => filterTagsByVote(nextVote, currentTags))
  }

  const toggleTag = (tag: MarketReviewTag) => {
    setSelectedTags((current) => {
      if (current.includes(tag)) return current.filter((item) => item !== tag)
      if (current.length >= 3) return current
      return [...current, tag]
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40 backdrop-blur-sm">
      <div className="flex h-full w-full max-w-xl p-3 sm:p-4">
        <DisplayPanel className="ml-auto flex h-full w-full flex-col rounded-[2rem] bg-white p-0 shadow-2xl">
          <div className="flex items-start justify-between gap-3 border-b border-border/60 p-5 sm:p-6">
            <DisplayPanelHeader className="space-y-2 p-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
                Review Loop
              </p>
              <DisplayPanelTitle className="text-2xl">
                {PAGE_COPY.market.reviewDrawerTitle}
              </DisplayPanelTitle>
              <DisplayPanelDescription>
                {PAGE_COPY.market.reviewDrawerSubtitle}
              </DisplayPanelDescription>
              <p className="text-sm font-black text-foreground">{tool.name}</p>
            </DisplayPanelHeader>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="rounded-full text-muted-foreground hover:bg-slate-100 hover:text-foreground"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <DisplayPanelContent className="flex-1 space-y-5 overflow-y-auto p-5 sm:p-6">
            <section>
              <p className="text-sm font-black text-foreground">
                {PAGE_COPY.market.reviewVoteTitle}
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => handleVoteChange('up')}
                  className={cn(
                    'rounded-[1.4rem] border px-4 py-3 text-left shadow-sm transition-colors',
                    vote === 'up'
                      ? 'border-emerald-500/25 bg-emerald-50 text-emerald-900'
                      : 'border-border/70 bg-white text-foreground hover:bg-slate-50',
                  )}
                >
                  <div className="flex items-center gap-2">
                    <ThumbsUp className="h-4 w-4" />
                    <span className="text-sm font-black">{PAGE_COPY.market.voteOptions.up}</span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => handleVoteChange('down')}
                  className={cn(
                    'rounded-[1.4rem] border px-4 py-3 text-left shadow-sm transition-colors',
                    vote === 'down'
                      ? 'border-rose-500/25 bg-rose-50 text-rose-900'
                      : 'border-border/70 bg-white text-foreground hover:bg-slate-50',
                  )}
                >
                  <div className="flex items-center gap-2">
                    <ThumbsDown className="h-4 w-4" />
                    <span className="text-sm font-black">{PAGE_COPY.market.voteOptions.down}</span>
                  </div>
                </button>
              </div>
            </section>

            <section>
              <p className="text-sm font-black text-foreground">
                {PAGE_COPY.market.reviewStarTitle}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {STAR_OPTIONS.map((star) => {
                  const active = (starRating ?? 0) >= star
                  return (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setStarRating(star)}
                      className={cn(
                        'inline-flex h-11 w-11 items-center justify-center rounded-full border shadow-sm transition-colors',
                        active
                          ? 'border-amber-300 bg-amber-50 text-amber-500'
                          : 'border-border/70 bg-white text-muted-foreground hover:bg-slate-50',
                      )}
                    >
                      <Star className={cn('h-5 w-5', active ? 'fill-current' : '')} />
                    </button>
                  )
                })}
              </div>
            </section>

            <section>
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-black text-foreground">
                  {PAGE_COPY.market.reviewTagsTitle}
                </p>
                <span className="text-[11px] font-semibold text-muted-foreground">
                  {selectedTags.length}/3
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {suggestedTags.map((tag) => {
                  const active = selectedTags.includes(tag)
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={cn(
                        'rounded-full border px-3 py-1.5 text-[11px] font-bold shadow-sm transition-colors',
                        active
                          ? 'border-primary/15 bg-primary text-primary-foreground shadow-[0_10px_24px_rgba(37,99,235,0.18)]'
                          : 'border-border/70 bg-white text-foreground/75 hover:bg-slate-50',
                      )}
                    >
                      {MARKET_ACTIVITY_COPY.reviewTags[tag]}
                    </button>
                  )
                })}
              </div>
            </section>
          </DisplayPanelContent>

          <div className="flex flex-wrap justify-end gap-2 border-t border-border/60 p-5 sm:p-6">
            <Button
              type="button"
              variant="outline"
              className="h-10 rounded-full px-4"
              onClick={onClose}
            >
              取消
            </Button>
            <Button
              type="button"
              className="h-10 rounded-full px-4"
              disabled={!canSubmit}
              onClick={() => {
                if (!vote || !starRating || selectedTags.length === 0) return
                onSubmit({
                  toolId: tool.id,
                  vote,
                  starRating,
                  selectedTags,
                })
              }}
            >
              {PAGE_COPY.market.reviewSubmitAction}
            </Button>
          </div>
        </DisplayPanel>
      </div>
    </div>
  )
}
