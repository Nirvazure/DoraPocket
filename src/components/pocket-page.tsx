'use client'

import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { PageShell } from '@/components/common/page-shell'
import { ProfileEntryPill } from '@/components/common/profile-entry-pill'
import { TopNavSwitch } from '@/components/common/top-nav-switch'
import { UnifiedTopBar } from '@/components/common/unified-top-bar'
import { PocketToolCard } from '@/components/pocket/pocket-tool-card'
import {
  DisplayPanel,
  DisplayPanelDescription,
  DisplayPanelHeader,
  DisplayPanelTitle,
} from '@/components/ui/display-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToolCardActions } from '@/hooks/use-tool-card-actions'
import {
  useMarkToolUsedMutation,
  usePocketInventoryQuery,
  useRemoveToolFromPocketMutation,
  useToggleArchiveToolMutation,
  useTogglePinToolMutation,
  useTogglePurchasedToolMutation,
} from '@/lib/query/pocket'
import type { PocketInventoryItem } from '@/services/pocket-inventory'
import { getToolById } from '@/services/tool-registry'
import { PAGE_COPY } from '@/shared/ui-copy'

type ResolvedPocketTool = {
  entry: PocketInventoryItem
  tool: NonNullable<ReturnType<typeof getToolById>>
}

function resolvePocketTools(items: PocketInventoryItem[]) {
  return items
    .map((entry) => ({ entry, tool: getToolById(entry.toolId) }))
    .filter((item): item is ResolvedPocketTool => Boolean(item.tool))
}

export function PocketPage() {
  const { data: pocketInventory = [] } = usePocketInventoryQuery()
  const removeToolFromPocketMutation = useRemoveToolFromPocketMutation()
  const togglePinToolMutation = useTogglePinToolMutation()
  const togglePurchasedToolMutation = useTogglePurchasedToolMutation()
  const toggleArchiveToolMutation = useToggleArchiveToolMutation()
  const markToolUsedMutation = useMarkToolUsedMutation()
  const [query, setQuery] = useState('')
  const toolCardActions = useToolCardActions({
    markToolUsed: markToolUsedMutation.mutate,
  })

  const keyword = query.trim().toLowerCase()
  const activeItems = useMemo(() => pocketInventory.filter((item) => !item.archived), [pocketInventory])
  const archivedItems = useMemo(() => pocketInventory.filter((item) => item.archived), [pocketInventory])

  const activeTools = useMemo(() => {
    const resolved = resolvePocketTools(activeItems)
    if (!keyword) return resolved
    return resolved.filter(({ tool }) =>
      `${tool.name} ${tool.description} ${tool.tags.join(' ')}`.toLowerCase().includes(keyword),
    )
  }, [activeItems, keyword])

  const pinnedTools = useMemo(() => activeTools.filter(({ entry }) => entry.pinned), [activeTools])
  const archivedTools = useMemo(() => resolvePocketTools(archivedItems), [archivedItems])

  return (
    <PageShell
      header={
        <UnifiedTopBar
          title={PAGE_COPY.pocket.title}
          subtitle={PAGE_COPY.pocket.subtitle}
          rightSlot={
            <div className="flex items-center gap-2">
              <TopNavSwitch current="pocket" />
              <ProfileEntryPill />
            </div>
          }
        />
      }
    >
      <div className="relative min-w-0 flex-1">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={PAGE_COPY.pocket.searchPlaceholder}
          className="pl-11"
        />
      </div>

      {activeItems.length === 0 ? (
        <DisplayPanel className="rounded-[2rem] bg-white/90 p-8 text-center">
          <DisplayPanelHeader className="p-0">
            <DisplayPanelTitle className="text-lg">{PAGE_COPY.pocket.emptyTitle}</DisplayPanelTitle>
            <DisplayPanelDescription className="mt-2 text-sm">
              {PAGE_COPY.pocket.emptyDescription}
            </DisplayPanelDescription>
          </DisplayPanelHeader>
          <Button asChild className="mt-5 h-10 rounded-full px-4 text-xs font-bold">
            <a href="/market">{PAGE_COPY.pocket.goMarketAction}</a>
          </Button>
        </DisplayPanel>
      ) : (
        <>
          {pinnedTools.length > 0 ? (
            <DisplayPanel className="rounded-[2rem] bg-white/90 p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
                    {PAGE_COPY.pocket.pinnedSection}
                  </p>
                  <h2 className="mt-1 text-2xl font-black text-foreground">
                    {PAGE_COPY.pocket.pinnedSection}
                  </h2>
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {pinnedTools.map(({ entry, tool }) => (
                  <PocketToolCard
                    key={entry.toolId}
                    toolId={entry.toolId}
                    toolName={tool.name}
                    toolIcon={tool.icon}
                    toolDescription={tool.description}
                    tags={tool.tags}
                    pinned={entry.pinned}
                    purchased={entry.purchased}
                    canOpenExternally={Boolean(tool.url)}
                    onTogglePin={() => togglePinToolMutation.mutate({ toolId: entry.toolId })}
                    onTogglePurchased={() =>
                      togglePurchasedToolMutation.mutate({ toolId: entry.toolId })
                    }
                    onToggleArchive={() => toggleArchiveToolMutation.mutate({ toolId: entry.toolId })}
                    onRemove={() => removeToolFromPocketMutation.mutate({ toolId: entry.toolId })}
                    onOpenExternal={() => toolCardActions.openTool(entry.toolId)}
                  />
                ))}
              </div>
            </DisplayPanel>
          ) : null}

          <DisplayPanel className="rounded-[2rem] bg-white/90 p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
                  {PAGE_COPY.pocket.collectionSection}
                </p>
                <h2 className="mt-1 text-2xl font-black text-foreground">
                  {PAGE_COPY.pocket.collectionSection}
                </h2>
              </div>
            </div>
            {activeTools.length === 0 ? (
              <DisplayPanel className="rounded-3xl border-dashed bg-slate-50 p-8 text-center text-sm font-semibold text-muted-foreground shadow-none">
                {PAGE_COPY.pocket.noSearchResult}
              </DisplayPanel>
            ) : (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {activeTools.map(({ entry, tool }) => (
                  <PocketToolCard
                    key={entry.toolId}
                    toolId={entry.toolId}
                    toolName={tool.name}
                    toolIcon={tool.icon}
                    toolDescription={tool.description}
                    tags={tool.tags}
                    pinned={entry.pinned}
                    purchased={entry.purchased}
                    canOpenExternally={Boolean(tool.url)}
                    onTogglePin={() => togglePinToolMutation.mutate({ toolId: entry.toolId })}
                    onTogglePurchased={() =>
                      togglePurchasedToolMutation.mutate({ toolId: entry.toolId })
                    }
                    onToggleArchive={() => toggleArchiveToolMutation.mutate({ toolId: entry.toolId })}
                    onRemove={() => removeToolFromPocketMutation.mutate({ toolId: entry.toolId })}
                    onOpenExternal={() => toolCardActions.openTool(entry.toolId)}
                  />
                ))}
              </div>
            )}
          </DisplayPanel>
        </>
      )}

      {archivedTools.length > 0 ? (
        <DisplayPanel className="rounded-[2rem] bg-white/90 p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
                {PAGE_COPY.pocket.archivedSection}
              </p>
              <h2 className="mt-1 text-2xl font-black text-foreground">
                {PAGE_COPY.pocket.archivedSection}
              </h2>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {archivedTools.map(({ entry, tool }) => (
              <PocketToolCard
                key={entry.toolId}
                toolId={entry.toolId}
                toolName={tool.name}
                toolIcon={tool.icon}
                toolDescription={tool.description}
                tags={tool.tags}
                pinned={entry.pinned}
                purchased={entry.purchased}
                archived
                canOpenExternally={Boolean(tool.url)}
                onToggleArchive={() => toggleArchiveToolMutation.mutate({ toolId: entry.toolId })}
                onRemove={() => removeToolFromPocketMutation.mutate({ toolId: entry.toolId })}
              />
            ))}
          </div>
        </DisplayPanel>
      ) : null}
    </PageShell>
  )
}
