'use client'

import { ScrollArea } from '@/components/ui/scroll-area'
import { ProfileEntryPill } from '@/components/common/profile-entry-pill'
import { PageShell } from '@/components/common/page-shell'
import { TopNavSwitch } from '@/components/common/top-nav-switch'
import { UnifiedTopBar } from '@/components/common/unified-top-bar'
import { MarketCategoryNav } from '@/components/market/market-category-nav'
import { MarketSubmitModal } from '@/components/market/market-submit-modal'
import { MarketToolGrid } from '@/components/market/market-tool-grid'
import { MarketToolbar } from '@/components/market/market-toolbar'
import { useMarketPageModel } from '@/hooks/use-market-page-model'
import { useToolCardActions } from '@/hooks/use-tool-card-actions'
import { useSubmitMarketToolMutation } from '@/lib/query/market'
import { useMarkToolUsedMutation, useSaveToolToPocketMutation } from '@/lib/query/pocket'
import { getActiveTools } from '@/services/tool-registry'
import { PAGE_COPY } from '@/shared/ui-copy'

export function MarketPage() {
  const saveToolToPocketMutation = useSaveToolToPocketMutation()
  const markToolUsedMutation = useMarkToolUsedMutation()
  const submitMarketToolMutation = useSubmitMarketToolMutation()
  const toolCardActions = useToolCardActions({
    markToolUsed: markToolUsedMutation.mutate,
    saveToolToPocket: saveToolToPocketMutation.mutate,
    getSourceQuestion: () => '从市场页收入口袋',
  })
  const marketModel = useMarketPageModel(getActiveTools(), submitMarketToolMutation.mutate)

  return (
    <PageShell
      className="overflow-hidden"
      contentClassName="pb-5 pt-5 sm:pt-6 lg:pt-6"
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
      <div className="grid min-h-0 gap-5 xl:grid-cols-[15rem_minmax(0,1fr)]">
        <MarketCategoryNav
          categoryEntries={marketModel.categoryEntries}
          categoryCounts={marketModel.categoryCounts}
          selectedSection={marketModel.selectedSection}
          onSelect={marketModel.setSelectedSection}
        />

        <div className="grid min-h-0 gap-4 xl:grid-rows-[auto_minmax(0,1fr)]">
          <MarketToolbar
            query={marketModel.query}
            onQueryChange={marketModel.setQuery}
            onOpenSubmit={() => marketModel.setSubmitOpen(true)}
          />

          <ScrollArea className="min-h-0 px-1">
            <MarketToolGrid
              tools={marketModel.currentCategoryTools}
              onSaveTool={toolCardActions.saveTool}
              onOpenTool={toolCardActions.openTool}
            />
          </ScrollArea>
        </div>
      </div>

      <MarketSubmitModal
        open={marketModel.submitOpen}
        draft={marketModel.draft}
        onClose={() => marketModel.setSubmitOpen(false)}
        onDraftChange={marketModel.setDraft}
        onSubmit={marketModel.submitDraft}
      />
    </PageShell>
  )
}
