'use client'

import { useMemo } from 'react'
import { LogIn } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ProfileEntryPill } from '@/components/common/profile-entry-pill'
import { PageShell } from '@/components/common/page-shell'
import { TopNavSwitch } from '@/components/common/top-nav-switch'
import { UnifiedTopBar } from '@/components/common/unified-top-bar'
import { MarketCategoryNav } from '@/components/market/market-category-nav'
import { MarketPageSkeleton } from '@/components/market/market-page-skeleton'
import { MarketReviewDrawer } from '@/components/market/market-review-drawer'
import { MarketSubmitModal } from '@/components/market/market-submit-modal'
import { MarketToolGrid } from '@/components/market/market-tool-grid'
import { MarketToolbar } from '@/components/market/market-toolbar'
import { buildActivePocketToolIds } from '@/hooks/market-scope'
import { useMarketPageModel } from '@/hooks/use-market-page-model'
import { useToolCardActions } from '@/hooks/use-tool-card-actions'
import { Button, buttonVariants } from '@/components/ui/button'
import {
  DisplayPanel,
  DisplayPanelContent,
  DisplayPanelDescription,
  DisplayPanelTitle,
} from '@/components/ui/display-shell'
import { useAuthSessionQuery } from '@/lib/query/auth-session'
import { cn } from '@/lib/utils'
import {
  useMarketReviewAggregatesQuery,
  useSaveMarketFeedbackMutation,
  useMarketToolsQuery,
  useSubmitMarketToolMutation,
} from '@/lib/query/market'
import {
  useMarkToolUsedMutation,
  usePocketInventoryQuery,
  useRemoveToolFromPocketMutation,
  useSaveToolToPocketMutation,
} from '@/lib/query/pocket'
import type { MarketSectionKey } from '@/hooks/market-scope'
import { PAGE_COPY } from '@/shared/ui-copy'

type MarketPageProps = {
  initialSection?: MarketSectionKey | null
}

export function MarketPage({ initialSection = null }: MarketPageProps) {
  const { data: authSession } = useAuthSessionQuery()
  const { data: pocketInventory = [] } = usePocketInventoryQuery()
  const saveToolToPocketMutation = useSaveToolToPocketMutation()
  const removeToolFromPocketMutation = useRemoveToolFromPocketMutation()
  const markToolUsedMutation = useMarkToolUsedMutation()
  const submitMarketToolMutation = useSubmitMarketToolMutation()
  const saveMarketFeedbackMutation = useSaveMarketFeedbackMutation()
  const { data: marketTools = [], isPending: marketToolsPending } = useMarketToolsQuery()
  const { data: reviewAggregates = {}, isPending: reviewAggregatesPending } =
    useMarketReviewAggregatesQuery()
  const showMarketShellSkeleton = marketToolsPending || reviewAggregatesPending

  const pocketToolIds = useMemo(() => buildActivePocketToolIds(pocketInventory), [pocketInventory])

  const isAuthenticated =
    authSession != null &&
    authSession.authenticated === true &&
    'user' in authSession &&
    authSession.user != null

  const toolCardActions = useToolCardActions({
    markToolUsed: markToolUsedMutation.mutate,
    saveToolToPocket: saveToolToPocketMutation.mutate,
    getSourceQuestion: () =>
      initialSection === 'pocket' ? '从我的口袋打开' : '从道具库收进我的口袋',
  })

  const marketModel = useMarketPageModel(
    marketTools,
    reviewAggregates,
    submitMarketToolMutation.mutate,
    { pocketToolIds, initialSection },
  )

  const showPocketLoginState = marketModel.marketScope === 'pocket' && !isAuthenticated
  const showPocketEmptyState =
    marketModel.marketScope === 'pocket' && isAuthenticated && marketModel.pocketCount === 0

  return (
    <PageShell
      className="overflow-hidden"
      contentClassName="pb-5 pt-5 sm:pt-6 lg:px-4 lg:pt-6 xl:px-3"
      header={
        <UnifiedTopBar
          title={PAGE_COPY.market.title}
          subtitle={PAGE_COPY.market.subtitle}
          rightSlot={
            <div className="flex items-center gap-1.5">
              <TopNavSwitch current="market" />
              <ProfileEntryPill />
            </div>
          }
        />
      }
    >
      {showMarketShellSkeleton ? (
        <MarketPageSkeleton />
      ) : (
        <div
          className={cn(
            'grid min-h-0 gap-5',
            marketModel.sidebarCollapsed
              ? 'xl:grid-cols-[5rem_minmax(0,1fr)]'
              : 'xl:grid-cols-[15rem_minmax(0,1fr)]',
          )}
        >
          <MarketCategoryNav
            categoryEntries={marketModel.categoryEntries}
            categoryCounts={marketModel.categoryCounts}
            sidebarCollapsed={marketModel.sidebarCollapsed}
            selectedSection={marketModel.selectedSection}
            onSelect={marketModel.selectSection}
            onToggleCollapsed={() => marketModel.setSidebarCollapsed((value: boolean) => !value)}
          />

          <div className="grid min-h-0 gap-4 xl:grid-rows-[auto_minmax(0,1fr)]">
            <MarketToolbar
              query={marketModel.query}
              onQueryChange={marketModel.setQuery}
              onOpenSubmit={() => marketModel.setSubmitOpen(true)}
              marketScope={marketModel.marketScope}
              pocketCount={marketModel.pocketCount}
              onScopeChange={marketModel.setScope}
            />

            <ScrollArea className="min-h-0 px-1">
              {showPocketLoginState ? (
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
              ) : marketModel.currentCategoryTools.length === 0 ? (
                <DisplayPanel className="rounded-[1.8rem] border-dashed border-slate-200 bg-slate-50/80 shadow-none">
                  <DisplayPanelContent className="space-y-2 p-6 text-center">
                    <DisplayPanelTitle className="text-xl text-slate-950">
                      没有找到匹配的工具
                    </DisplayPanelTitle>
                    <DisplayPanelDescription className="text-sm text-slate-600">
                      {marketModel.marketScope === 'pocket'
                        ? PAGE_COPY.pocket.noSearchResult
                        : PAGE_COPY.market.searchPlaceholder}
                    </DisplayPanelDescription>
                  </DisplayPanelContent>
                </DisplayPanel>
              ) : (
                <MarketToolGrid
                  tools={marketModel.currentCategoryTools}
                  mode={marketModel.marketScope}
                  savedToolIds={pocketToolIds}
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
