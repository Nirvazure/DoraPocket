'use client'

import Image from 'next/image'
import { useMemo, useState, useSyncExternalStore } from 'react'
import { LogIn, Store } from 'lucide-react'
import { LoginEntryButton } from '@/components/auth/login-entry-button'
import { PageShell } from '@/components/common/page-shell'
import { TopNavSwitch } from '@/components/common/top-nav-switch'
import { UnifiedTopBar } from '@/components/common/unified-top-bar'
import { MarketCategoryNav } from '@/app/market/_components/market-category-nav'
import { MarketCuratedHome } from '@/app/market/_components/market-curated-home'
import {
  MarketPageSkeleton,
  MarketToolGridSkeleton,
} from '@/app/market/_components/market-page-skeleton'
import { MarketReviewDrawer } from '@/app/market/_components/market-review-drawer'
import { MarketSubmitModal } from '@/app/market/_components/market-submit-modal'
import { MarketToolGrid } from '@/app/market/_components/market-tool-grid'
import { MarketToolbar } from '@/app/market/_components/market-toolbar'
import { Button, buttonVariants } from '@/components/ui/button'
import {
  DisplayPanel,
  DisplayPanelContent,
  DisplayPanelDescription,
  DisplayPanelTitle,
} from '@/components/ui/display-shell'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { useMarketPageModel } from '@/app/market/_hooks/use-market-page-model'
import { useToolCardActions } from '@/hooks/use-tool-card-actions'
import { useAuthSessionQuery } from '@/lib/query/auth-session'
import {
  useDeleteMarketToolMutation,
  useMarketReviewAggregatesQuery,
  useMarketToolsByIdsQuery,
  useMarketToolsQuery,
  useSaveMarketFeedbackMutation,
  useSubmitMarketToolMutation,
} from '@/lib/query/market'
import {
  useMarkToolUsedMutation,
  usePocketInventoryQuery,
  useRemoveToolFromPocketMutation,
  useSaveToolToPocketMutation,
} from '@/lib/query/pocket'
import { cn } from '@/lib/utils'
import type { MarketSectionKey } from '@/shared/market/market-scope'
import {
  buildActivePocketToolIds,
  DISCOVER_HOME_SECTION_KEY,
  type MarketDiscoverSectionKey,
  type MarketToolCardItem,
} from '@/shared/market/market-scope'
import { resolveIsOwnedByViewer } from '@/shared/market/owned-tool-delete'
import { MARKET_OWNER_USER_ID } from '@/shared/market/market-owner'
import { APP_BRAND_TITLE, PAGE_COPY } from '@/shared/copy/ui-copy'

type MarketPageClientProps = {
  initialSection?: MarketSectionKey | null
}

function rankFeaturedTool(tool: {
  reviewAggregate: { averageStar: number | null; reviewCount: number } | null
  ratingSummary: { score: number }
  usageStats: { saves: number }
  tags: string[]
}) {
  const aggregate = tool.reviewAggregate
  return (
    (aggregate?.averageStar ?? 0) * 24 +
    (aggregate?.reviewCount ?? 0) * 4 +
    Math.max(0, tool.ratingSummary.score) * 3 +
    tool.usageStats.saves * 0.5 +
    tool.tags.length * 1.5
  )
}

export function MarketPageClient({ initialSection = null }: MarketPageClientProps) {
  const [query, setQuery] = useState('')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const debouncedQuery = useDebouncedValue(query, 300)
  const { data: authSession, isPending: authPending } = useAuthSessionQuery()
  const { data: pocketInventory = [] } = usePocketInventoryQuery()
  const saveToolToPocketMutation = useSaveToolToPocketMutation()
  const removeToolFromPocketMutation = useRemoveToolFromPocketMutation()
  const markToolUsedMutation = useMarkToolUsedMutation()
  const submitMarketToolMutation = useSubmitMarketToolMutation()
  const deleteMarketToolMutation = useDeleteMarketToolMutation()
  const saveMarketFeedbackMutation = useSaveMarketFeedbackMutation()
  const {
    data: marketTools = [],
    isPending: marketToolsPending,
    isFetching: marketToolsFetching,
    isError: marketToolsError,
    refetch: refetchMarketTools,
  } = useMarketToolsQuery(debouncedQuery)
  const { data: reviewAggregates = {}, isPending: reviewAggregatesPending } =
    useMarketReviewAggregatesQuery()
  const hasMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  )

  const showInitialSkeleton = !hasMounted || (marketToolsPending && reviewAggregatesPending)
  const showGridSkeleton = !showInitialSkeleton && marketToolsFetching

  const pocketToolIds = useMemo(() => buildActivePocketToolIds(pocketInventory), [pocketInventory])
  const pocketToolIdList = useMemo(() => [...pocketToolIds], [pocketToolIds])
  const { data: pocketResolvedTools = [] } = useMarketToolsByIdsQuery(pocketToolIdList)

  const authUser =
    authSession != null &&
    authSession.authenticated === true &&
    'user' in authSession &&
    authSession.user != null
      ? authSession.user
      : null
  const isAuthenticated = authUser != null

  const viewerUserId = authUser?.id ?? null
  const isMarketOwnerViewer =
    viewerUserId === MARKET_OWNER_USER_ID || authUser?.isMarketOwner === true

  const mergedMarketTools = useMemo(() => {
    const byId = new Map(marketTools.map((tool) => [tool.id, tool]))
    for (const tool of pocketResolvedTools) {
      byId.set(tool.id, tool)
    }
    return [...byId.values()].map((tool) => ({
      ...tool,
      // Market owner may delete any tool currently attributed to them (including seed backfill).
      isOwnedByViewer: isMarketOwnerViewer
        ? tool.createdByUserId == null ||
          tool.createdByUserId === MARKET_OWNER_USER_ID ||
          tool.createdByUserId === viewerUserId
        : resolveIsOwnedByViewer(tool.createdByUserId, viewerUserId),
    }))
  }, [marketTools, pocketResolvedTools, viewerUserId, isMarketOwnerViewer])

  const unavailablePocketToolIds = useMemo(() => {
    const resolved = new Set(pocketResolvedTools.map((tool) => tool.id))
    return pocketToolIdList.filter((id) => !resolved.has(id))
  }, [pocketResolvedTools, pocketToolIdList])
  const toolCardActions = useToolCardActions({
    authPending,
    isAuthenticated,
    markToolUsed: markToolUsedMutation.mutate,
    saveToolToPocket: saveToolToPocketMutation.mutate,
    getSourceQuestion: () => (initialSection === 'pocket' ? '从我的口袋打开' : '从道具库收进口袋'),
  })

  const handleDeleteOwnedTool = (toolId: string) => {
    if (!window.confirm(PAGE_COPY.market.deleteOwnedConfirm)) return
    deleteMarketToolMutation.mutate({ toolId })
  }

  const marketModel = useMarketPageModel(
    mergedMarketTools,
    reviewAggregates,
    submitMarketToolMutation.mutate,
    { pocketToolIds, initialSection, query, onQueryChange: setQuery },
  )

  const hasQuery = marketModel.query.trim().length > 0
  const showDiscoverHomepage =
    marketModel.marketScope === 'discover' &&
    !hasQuery &&
    marketModel.selectedSection === DISCOVER_HOME_SECTION_KEY

  const featuredMarketTools = useMemo(
    () =>
      mergedMarketTools
        .map(
          (tool): MarketToolCardItem => ({
            ...tool,
            reviewAggregate: reviewAggregates[tool.id] ?? null,
          }),
        )
        .sort((a, b) => rankFeaturedTool(b) - rankFeaturedTool(a))
        .slice(0, 6),
    [mergedMarketTools, reviewAggregates],
  )

  const showPocketLoginState = marketModel.marketScope === 'pocket' && !isAuthenticated
  const showPocketEmptyState =
    marketModel.marketScope === 'pocket' &&
    isAuthenticated &&
    marketModel.totalPocketCount === 0 &&
    unavailablePocketToolIds.length === 0

  return (
    <PageShell
      className="overflow-hidden"
      contentClassName="pb-5 pt-4 sm:pt-5 lg:pt-6"
      contentMaxWidthClassName="max-w-[min(100%,132rem)]"
      header={
        <UnifiedTopBar
          title={APP_BRAND_TITLE}
          subtitle={PAGE_COPY.market.subtitle}
          rightSlot={
            <div className="flex items-center gap-1.5">
              <TopNavSwitch current="market" />
              <LoginEntryButton />
            </div>
          }
        />
      }
    >
      {showInitialSkeleton ? (
        <MarketPageSkeleton />
      ) : (
        <div
          className={cn('dp-market-workbench', sidebarCollapsed && 'dp-market-workbench-collapsed')}
        >
          <MarketCategoryNav
            navigationEntries={
              marketModel.navigationEntries as ReadonlyArray<
                readonly [MarketDiscoverSectionKey, string]
              >
            }
            categoryCounts={marketModel.categoryCounts}
            selectedSection={marketModel.selectedSection}
            collapsed={sidebarCollapsed}
            onToggleCollapsed={() => setSidebarCollapsed((value) => !value)}
            onSelect={marketModel.selectSection}
          />

          <div className="dp-market-content-shell">
            <MarketToolbar
              query={marketModel.query}
              onQueryChange={marketModel.setQuery}
              onOpenSubmit={() => marketModel.setSubmitOpen(true)}
            />

            <div className="dp-market-body-slot px-1 pb-1">
              {showGridSkeleton ? (
                <MarketToolGridSkeleton />
              ) : marketToolsError ? (
                <DisplayPanel className="rounded-[1.8rem] border-dashed border-slate-200 bg-slate-50/80 shadow-none">
                  <DisplayPanelContent className="space-y-3 p-6 text-center">
                    <DisplayPanelTitle className="text-xl text-slate-950">
                      {PAGE_COPY.market.loadFailedTitle}
                    </DisplayPanelTitle>
                    <DisplayPanelDescription className="text-sm text-slate-600">
                      {PAGE_COPY.market.loadFailedDescription}
                    </DisplayPanelDescription>
                    <Button
                      type="button"
                      className="mt-2 h-10 rounded-full px-4 text-sm font-bold"
                      onClick={() => void refetchMarketTools()}
                    >
                      {PAGE_COPY.market.loadRetryAction}
                    </Button>
                  </DisplayPanelContent>
                </DisplayPanel>
              ) : showPocketLoginState ? (
                <DisplayPanel className="rounded-[1.8rem] border-dashed border-slate-200 bg-slate-50/80 shadow-none">
                  <DisplayPanelContent className="space-y-3 p-6 text-center">
                    <DisplayPanelTitle className="text-xl text-slate-950">
                      先登录，再管理口袋里的工具
                    </DisplayPanelTitle>
                    <DisplayPanelDescription className="text-sm text-slate-600">
                      登录后，DoraPocket 才能为你同步收藏和使用记录。
                    </DisplayPanelDescription>
                    <a
                      href="/login"
                      className={cn(
                        buttonVariants({ variant: 'default' }),
                        'mt-2 inline-flex h-10 rounded-full px-4 text-sm font-bold',
                      )}
                    >
                      <LogIn className="h-4 w-4" />
                      去登录
                    </a>
                  </DisplayPanelContent>
                </DisplayPanel>
              ) : showPocketEmptyState ? (
                <DisplayPanel className="rounded-[1.8rem] border-dashed border-slate-200 bg-slate-50/80 shadow-none">
                  <DisplayPanelContent className="space-y-3 p-6 text-center">
                    <DisplayPanelTitle className="text-xl text-slate-950">
                      {PAGE_COPY.market.pocketEmptyTitle}
                    </DisplayPanelTitle>
                    <DisplayPanelDescription className="text-sm text-slate-600">
                      {PAGE_COPY.market.pocketEmptyDescription}
                    </DisplayPanelDescription>
                    <Button
                      type="button"
                      className="mt-2 h-10 rounded-full px-4 text-sm font-bold"
                      onClick={() => marketModel.setScope('discover')}
                    >
                      {PAGE_COPY.market.pocketEmptyAction}
                    </Button>
                  </DisplayPanelContent>
                </DisplayPanel>
              ) : marketModel.currentCategoryTools.length === 0 &&
                unavailablePocketToolIds.length === 0 ? (
                <DisplayPanel className="rounded-[1.8rem] border-dashed border-slate-200 bg-slate-50/80 shadow-none">
                  <DisplayPanelContent className="space-y-2 p-6 text-center">
                    <DisplayPanelTitle className="text-xl text-slate-950">
                      没有找到匹配的工具
                    </DisplayPanelTitle>
                    <DisplayPanelDescription className="text-sm text-slate-600">
                      {PAGE_COPY.market.noSearchResult}
                    </DisplayPanelDescription>
                  </DisplayPanelContent>
                </DisplayPanel>
              ) : showDiscoverHomepage ? (
                <MarketCuratedHome
                  featuredTools={featuredMarketTools}
                  savedToolIds={pocketToolIds}
                  onSaveTool={toolCardActions.saveTool}
                  onRemoveTool={(toolId) => removeToolFromPocketMutation.mutate({ toolId })}
                  onOpenTool={toolCardActions.openTool}
                  onReviewTool={marketModel.openReviewTool}
                  onDeleteTool={handleDeleteOwnedTool}
                />
              ) : (
                <section>
                  <MarketToolGrid
                    tools={marketModel.currentCategoryTools}
                    savedToolIds={pocketToolIds}
                    unavailableToolIds={
                      marketModel.marketScope === 'pocket' ? unavailablePocketToolIds : []
                    }
                    onSaveTool={toolCardActions.saveTool}
                    onRemoveTool={(toolId) => removeToolFromPocketMutation.mutate({ toolId })}
                    onOpenTool={toolCardActions.openTool}
                    onReviewTool={marketModel.openReviewTool}
                    onDeleteTool={handleDeleteOwnedTool}
                  />
                </section>
              )}
            </div>
          </div>
        </div>
      )}

      {!showInitialSkeleton ? (
        <button
          type="button"
          className="dp-market-pocket-fab"
          aria-label={marketModel.marketScope === 'discover' ? '打开我的口袋' : '返回道具市场'}
          onClick={() =>
            marketModel.setScope(marketModel.marketScope === 'discover' ? 'pocket' : 'discover')
          }
        >
          <span className="dp-market-pocket-fab-image">
            {marketModel.marketScope === 'discover' ? (
              <Image src="/images/pocket.png" alt="" fill sizes="64px" className="object-contain" />
            ) : (
              <Store className="dp-market-pocket-fab-glyph" />
            )}
          </span>
          <span className="dp-market-pocket-fab-label">
            {marketModel.marketScope === 'discover' ? '我的口袋' : '道具市场'}
          </span>
        </button>
      ) : null}

      <MarketSubmitModal
        open={marketModel.submitOpen}
        draft={marketModel.draft}
        onClose={() => marketModel.setSubmitOpen(false)}
        onDraftChange={marketModel.setDraft}
        onSubmit={marketModel.submitDraft}
      />

      <MarketReviewDrawer
        key={marketModel.reviewTool?.id ?? 'closed'}
        open={marketModel.reviewOpen}
        tool={marketModel.reviewTool}
        onClose={marketModel.closeReviewTool}
        onSubmit={(input) => {
          saveMarketFeedbackMutation.mutate(input)
          marketModel.closeReviewTool()
        }}
      />
    </PageShell>
  )
}
