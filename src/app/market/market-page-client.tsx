'use client'

import { useMemo, useState, useSyncExternalStore } from 'react'
import { LogIn } from 'lucide-react'
import { LoginEntryButton } from '@/components/auth/login-entry-button'
import { PageShell } from '@/components/common/page-shell'
import { TopNavSwitch } from '@/components/common/top-nav-switch'
import { UnifiedTopBar } from '@/components/common/unified-top-bar'
import { MarketCategoryNav } from '@/app/market/_components/market-category-nav'
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
import { ScrollArea } from '@/components/ui/scroll-area'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { useMarketPageModel } from '@/app/market/_hooks/use-market-page-model'
import { useToolCardActions } from '@/hooks/use-tool-card-actions'
import { useAuthSessionQuery } from '@/lib/query/auth-session'
import {
  useMarketReviewAggregatesQuery,
  useSaveMarketFeedbackMutation,
  useMarketToolsByIdsQuery,
  useMarketToolsQuery,
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
import { buildActivePocketToolIds } from '@/shared/market/market-scope'
import { APP_BRAND_TITLE, PAGE_COPY } from '@/shared/copy/ui-copy'

type MarketPageClientProps = {
  initialSection?: MarketSectionKey | null
}

export function MarketPageClient({ initialSection = null }: MarketPageClientProps) {
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebouncedValue(query, 300)
  const { data: authSession, isPending: authPending } = useAuthSessionQuery()
  const { data: pocketInventory = [] } = usePocketInventoryQuery()
  const saveToolToPocketMutation = useSaveToolToPocketMutation()
  const removeToolFromPocketMutation = useRemoveToolFromPocketMutation()
  const markToolUsedMutation = useMarkToolUsedMutation()
  const submitMarketToolMutation = useSubmitMarketToolMutation()
  const saveMarketFeedbackMutation = useSaveMarketFeedbackMutation()
  const {
    data: marketTools = [],
    isPending: marketToolsPending,
    isFetching: marketToolsFetching,
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

  const mergedMarketTools = useMemo(() => {
    const byId = new Map(marketTools.map((tool) => [tool.id, tool]))
    for (const tool of pocketResolvedTools) {
      byId.set(tool.id, tool)
    }
    return [...byId.values()]
  }, [marketTools, pocketResolvedTools])

  const unavailablePocketToolIds = useMemo(() => {
    const resolved = new Set(pocketResolvedTools.map((tool) => tool.id))
    return pocketToolIdList.filter((id) => !resolved.has(id))
  }, [pocketResolvedTools, pocketToolIdList])

  const isAuthenticated =
    authSession != null &&
    authSession.authenticated === true &&
    'user' in authSession &&
    authSession.user != null

  const toolCardActions = useToolCardActions({
    authPending,
    isAuthenticated,
    markToolUsed: markToolUsedMutation.mutate,
    saveToolToPocket: saveToolToPocketMutation.mutate,
    getSourceQuestion: () =>
      initialSection === 'pocket' ? '从我的口袋打开' : '从道具库收进我的口袋',
  })

  const marketModel = useMarketPageModel(
    mergedMarketTools,
    reviewAggregates,
    submitMarketToolMutation.mutate,
    { pocketToolIds, initialSection, query, onQueryChange: setQuery },
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
      contentClassName="pb-5 pt-5 sm:pt-6 lg:pt-6"
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
        <div className="grid min-h-0 gap-5 xl:grid-cols-[15rem_minmax(0,1fr)]">
          <MarketCategoryNav
            categoryEntries={marketModel.categoryEntries}
            categoryCounts={marketModel.categoryCounts}
            selectedSection={marketModel.selectedSection}
            marketScope={marketModel.marketScope}
            discoverCount={marketModel.discoverCount}
            pocketCount={marketModel.totalPocketCount}
            onScopeChange={marketModel.setScope}
            onSelect={marketModel.selectSection}
          />

          <div className="grid min-h-0 gap-4 xl:grid-rows-[auto_minmax(0,1fr)]">
            <MarketToolbar
              query={marketModel.query}
              onQueryChange={marketModel.setQuery}
              onOpenSubmit={() => marketModel.setSubmitOpen(true)}
            />

            <ScrollArea className="min-h-0 px-1">
              {showGridSkeleton ? (
                <MarketToolGridSkeleton />
              ) : showPocketLoginState ? (
                <DisplayPanel className="rounded-[1.8rem] border-dashed border-slate-200 bg-slate-50/80 shadow-none">
                  <DisplayPanelContent className="space-y-3 p-6 text-center">
                    <DisplayPanelTitle className="text-xl text-slate-950">
                      先登录，再管理口袋里的工具
                    </DisplayPanelTitle>
                    <DisplayPanelDescription className="text-sm text-slate-600">
                      登录后，DoraPocket 才能替你同步收藏。
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
              ) : (
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
                />
              )}
            </ScrollArea>
          </div>
        </div>
      )}

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
