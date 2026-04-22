import { useEffect, useRef, useState } from 'react'
import { ExternalLink, Search, Sparkles, TriangleAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { UnifiedTopBar } from '@/components/common/unified-top-bar'
import { cn } from '@/lib/utils'
import type { AgentUiPayload } from '@/shared/market-types'
import { getMarketTools, getToolById, rankTools, type ToolItem } from '@/services/tool-registry'
import {
  buildMarketContext,
  getToolActivityStats,
  loadMarketFeedback,
  loadMarketSubscriptions,
  recentMarketActivity,
  recordToolSubscribed,
  setToolSubscription,
} from '@/services/market-storage'
import { useStore } from '@/store'

type MarketPageProps = {
  open: boolean
  onClose: () => void
  currentPrompt?: string | null
  focusedToolId?: string | null
  agentPayload?: AgentUiPayload | null
}

type DecoratedMarketTool = {
  tool: ToolItem
  totalScore: number
  totalSaves: number
  totalOpens: number
  totalSubscriptions: number
  fitLabel: string
}

function marketFitLabel(tool: ToolItem) {
  if (tool.executionMode === 'reference_only') return '适合先看资料，再决定是否上手'
  if (tool.category === 'search') return '适合先做检索和比对'
  if (tool.category === 'dev') return '适合明确开发任务后直达使用'
  if (tool.category === 'design') return '适合解决单点素材或视觉生产'
  if (tool.category === 'writing') return '适合快速整理与输出'
  return '适合沉淀为稳定复用入口'
}

function buildMarketToolView(tool: ToolItem): DecoratedMarketTool {
  const activity = getToolActivityStats(tool.id)
  return {
    tool,
    totalScore: tool.ratingSummary.score,
    totalSaves: tool.usageStats.saves + activity.saves,
    totalOpens: tool.usageStats.opens + activity.opens,
    totalSubscriptions: tool.usageStats.subscriptions + activity.subscriptions,
    fitLabel: marketFitLabel(tool),
  }
}

function compactDecisionSignals(item: DecoratedMarketTool) {
  return [
    item.tool.executionMode === 'native_card' ? '可直接执行' : null,
    !item.tool.requiresAuth ? '上手轻' : '需登录',
    item.tool.pricingModel === 'free' ? '免费' : item.tool.pricingModel === 'freemium' ? '可先试用' : '有付费门槛',
    item.tool.subscriptionSupport ? '适合长期跟踪' : '偏即用即走',
  ].filter(Boolean)
}

export function MarketPage({ open, onClose, currentPrompt, focusedToolId, agentPayload }: MarketPageProps) {
  const [query, setQuery] = useState('')
  const toolRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const { pocketInventory, saveToolToPocket, markToolUsed } = useStore()

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, open])

  useEffect(() => {
    if (!open || !focusedToolId) return
    const element = toolRefs.current[focusedToolId]
    if (!element) return
    const id = window.requestAnimationFrame(() => {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })
    return () => window.cancelAnimationFrame(id)
  }, [focusedToolId, open])

  const feedbackMap = new Map(loadMarketFeedback().map((item) => [item.toolId, item.vote] as const))
  const subscribedIds = new Set(loadMarketSubscriptions().filter((item) => item.active).map((item) => item.toolId))
  const rankingQuery = currentPrompt?.trim() || query.trim() || '工具推荐'
  const marketContext = buildMarketContext(pocketInventory)
  const recommendationMap = new Map(
    rankTools(rankingQuery, {
      savedToolIds: marketContext.savedItems.map((item) => item.toolId),
      subscribedToolIds: marketContext.subscriptions.filter((item) => item.active).map((item) => item.toolId),
      upvotedToolIds: marketContext.feedback.filter((item) => item.vote === 'up').map((item) => item.toolId),
      downvotedToolIds: marketContext.feedback.filter((item) => item.vote === 'down').map((item) => item.toolId),
      preferredCategories: marketContext.preferenceProfile.preferredCategories,
      preferredTags: marketContext.preferenceProfile.preferredTags,
      preferredPlatforms: marketContext.preferenceProfile.preferredPlatforms,
      preferredPricing: marketContext.preferenceProfile.preferredPricing,
      preferredExecutionModes: marketContext.preferenceProfile.preferredExecutionModes,
      avoidAuthWall: marketContext.preferenceProfile.avoidAuthWall,
      prefersSubscriptionTools: marketContext.preferenceProfile.prefersSubscriptionTools,
    })
      .filter((match) => match.tool.source !== 'builtin')
      .slice(0, 8)
      .map((match, index) => [match.tool.id, { rank: index, reason: match.reason }] as const),
  )

  const keyword = query.trim().toLowerCase()
  const marketTools = getMarketTools()
    .filter((tool) => tool.source !== 'builtin')
    .filter((tool) => {
      if (!keyword) return true
      return `${tool.name} ${tool.description} ${tool.tags.join(' ')}`.toLowerCase().includes(keyword)
    })
    .map(buildMarketToolView)
    .sort((a, b) => {
      const aCandidate = recommendationMap.get(a.tool.id)
      const bCandidate = recommendationMap.get(b.tool.id)
      if (aCandidate && bCandidate && aCandidate.rank !== bCandidate.rank) return aCandidate.rank - bCandidate.rank
      if (aCandidate && !bCandidate) return -1
      if (!aCandidate && bCandidate) return 1
      return b.totalScore - a.totalScore
    })
  const topTools = marketTools.slice(0, 3)
  const activities = recentMarketActivity(5)

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[65]">
      <div className="absolute inset-0 bg-slate-950/55 backdrop-blur-[4px]" aria-hidden />
      <section className="relative z-[1] flex h-full w-full flex-col bg-background/95 motion-safe:animate-dp-page-in" role="dialog" aria-modal="true" aria-label="比较依据空间">
        <UnifiedTopBar
          title="比较依据空间"
          subtitle="这里只解释为什么排前面，不把你带去逛工具广场。"
          onBack={onClose}
          statusSlot={
            currentPrompt ? <span className="rounded-full border border-border/60 bg-white px-3 py-1 text-[11px] font-semibold text-foreground/75">当前任务已锁定</span> : null
          }
        />

        <main className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 pt-3 sm:px-6 sm:pb-6 sm:pt-4">
          <div className="mx-auto w-full max-w-7xl space-y-4">
            <section className="rounded-3xl border border-border/60 bg-white p-4 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">当前比较上下文</p>
              <h2 className="mt-2 text-2xl font-black text-foreground">{currentPrompt?.trim() || '还没有锁定任务，先从首页发起裁决。'}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {agentPayload?.selectionReason || '市场页只展示比较依据、真实反馈与候选排序，不重复承担首页结论出口。'}
              </p>
            </section>

            <div className="grid gap-4 xl:grid-cols-[0.9fr,1.1fr]">
              <article className="rounded-3xl border border-border/60 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">TOP 候选</p>
                    <p className="mt-1 text-base font-black text-foreground">当前最值得先看的三个工具</p>
                  </div>
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
                <div className="mt-4 space-y-3">
                  {topTools.map((item, index) => (
                    <div key={item.tool.id} className={cn('rounded-3xl border p-4', index === 0 ? 'border-primary/25 bg-primary/[0.05]' : 'border-border/55 bg-slate-50')}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-black text-foreground">TOP {index + 1} · {item.tool.name}</p>
                          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{recommendationMap.get(item.tool.id)?.reason ?? item.fitLabel}</p>
                        </div>
                        <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold text-muted-foreground">评分 {item.totalScore}</span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {compactDecisionSignals(item).map((signal) => (
                          <span key={signal} className="rounded-full border border-border/55 bg-white px-2.5 py-1 text-[10px] text-muted-foreground">{signal}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </article>

              <article className="rounded-3xl border border-border/60 bg-white p-4 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">真实信号</p>
                    <p className="mt-1 text-base font-black text-foreground">Agent 为什么愿意长期把它们排在前面</p>
                  </div>
                  <TriangleAlert className="h-4 w-4 text-primary" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: '已收藏', value: pocketInventory.length, hint: '你已经沉淀进复用系统的入口' },
                    { label: '已订阅', value: subscribedIds.size, hint: '你愿意长期追踪的工具' },
                    { label: '已反馈', value: feedbackMap.size, hint: '你给排序的真实信号' },
                    { label: '动态数', value: activities.length, hint: '近期真实发生的市场变化' },
                  ].map((item) => (
                    <div key={item.label} className="rounded-2xl border border-border/55 bg-slate-50 px-3 py-3">
                      <p className="text-[11px] font-semibold text-muted-foreground">{item.label}</p>
                      <p className="mt-1 text-xl font-black text-foreground">{item.value}</p>
                      <p className="text-[11px] text-muted-foreground">{item.hint}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 space-y-2">
                  {activities.map((item) => (
                    <div key={item.id} className="rounded-2xl border border-border/55 bg-slate-50 px-3 py-2">
                      <p className="text-xs font-semibold text-foreground">{item.title}</p>
                      <p className="mt-1 text-[11px] text-muted-foreground">{item.detail}</p>
                    </div>
                  ))}
                </div>
              </article>
            </div>

            <section className="rounded-3xl border border-border/60 bg-white p-4 shadow-sm">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">详细条目</p>
                  <p className="mt-1 text-base font-black text-foreground">继续看依据，而不是继续加噪音</p>
                </div>
                <div className="relative w-full max-w-sm">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索比较依据、标签和工具名…" className="h-10 w-full rounded-full border border-border/70 bg-background pl-9 pr-3 text-sm outline-none ring-primary/30 placeholder:text-muted-foreground focus-visible:ring-2" />
                </div>
              </div>
              <div className="space-y-3">
                {marketTools.map((item) => {
                  const subscribed = subscribedIds.has(item.tool.id)
                  const url = getToolById(item.tool.id)?.url
                  const saved = pocketInventory.some((entry) => entry.toolId === item.tool.id)
                  return (
                    <div key={item.tool.id} ref={(node) => { toolRefs.current[item.tool.id] = node }} className={cn('rounded-3xl border p-4', focusedToolId === item.tool.id ? 'border-primary bg-primary/[0.04]' : 'border-border/55 bg-slate-50')}>
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-black text-foreground">{item.tool.name}</p>
                          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{recommendationMap.get(item.tool.id)?.reason ?? item.fitLabel}</p>
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {compactDecisionSignals(item).map((signal) => (
                              <span key={signal} className="rounded-full border border-border/55 bg-white px-2 py-0.5 text-[10px] text-muted-foreground">{signal}</span>
                            ))}
                            {feedbackMap.get(item.tool.id) === 'up' ? <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] text-emerald-700">你点过好用</span> : null}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button type="button" size="sm" variant="outline" className="h-8 rounded-full px-3 text-[11px]" onClick={() => saveToolToPocket(item.tool.id)}>
                            {saved ? '已在口袋' : '收入口袋'}
                          </Button>
                          {item.tool.subscriptionSupport ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="h-8 rounded-full px-3 text-[11px]"
                              onClick={() => {
                                if (!subscribed) recordToolSubscribed(item.tool.id)
                                setToolSubscription(item.tool.id, !subscribed)
                              }}
                            >
                              {subscribed ? '取消订阅' : '订阅'}
                            </Button>
                          ) : null}
                          {url ? (
                            <Button
                              type="button"
                              size="sm"
                              className="h-8 rounded-full px-3 text-[11px]"
                              onClick={() => {
                                markToolUsed(item.tool.id)
                                window.open(url, '_blank', 'noopener,noreferrer')
                              }}
                            >
                              <ExternalLink className="mr-1 h-3.5 w-3.5" />
                              打开
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          </div>
        </main>
      </section>
    </div>
  )
}
