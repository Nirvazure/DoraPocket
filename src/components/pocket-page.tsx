'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { CheckCircle2, ExternalLink, Pin, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ProfileEntryPill } from '@/components/common/profile-entry-pill'
import { PageShell } from '@/components/common/page-shell'
import { TopNavSwitch } from '@/components/common/top-nav-switch'
import { UnifiedTopBar } from '@/components/common/unified-top-bar'
import { useToolCardActions } from '@/hooks/use-tool-card-actions'
import {
  useMarkToolUsedMutation,
  usePocketInventoryQuery,
  useRemoveToolFromPocketMutation,
  useToggleArchiveToolMutation,
  useTogglePinToolMutation,
  useTogglePurchasedToolMutation,
} from '@/lib/query/pocket'
import { type PocketInventoryItem } from '@/services/pocket-inventory'
import { getToolById } from '@/services/tool-registry'

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

  const activeItems = pocketInventory.filter((item) => !item.archived)
  const archivedItems = pocketInventory.filter((item) => item.archived)
  const keyword = query.trim().toLowerCase()

  const activeTools = useMemo(() => {
    const resolved = resolvePocketTools(activeItems)
    if (!keyword) return resolved
    return resolved.filter(({ tool }) => `${tool.name} ${tool.description} ${tool.tags.join(' ')}`.toLowerCase().includes(keyword))
  }, [activeItems, keyword])

  const pinnedTools = activeTools.filter(({ entry }) => entry.pinned)
  const allCollectedTools = activeTools
  const archivedTools = useMemo(() => resolvePocketTools(archivedItems), [archivedItems])

  const renderPocketCard = ({ entry, tool }: ResolvedPocketTool) => (
    <article key={entry.toolId} className="flex min-h-56 flex-col rounded-3xl border border-border/60 bg-slate-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-lg font-black text-foreground">{tool.icon} {tool.name}</p>
          <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-muted-foreground">{tool.description}</p>
        </div>
        <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
          {entry.pinned ? <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold text-amber-800">已置顶</span> : null}
          {entry.purchased ? <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold text-emerald-800">已购入</span> : null}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {tool.tags.slice(0, 4).map((tag) => (
          <span key={tag} className="rounded-full border border-white/80 bg-white px-2 py-0.5 text-[10px] font-semibold text-foreground/70">
            {tag}
          </span>
        ))}
      </div>
      <div className="mt-auto pt-4">
        <div className="mt-3 flex flex-wrap gap-2">
          <Button type="button" variant="outline" className="h-9 rounded-full bg-white px-3 text-xs" onClick={() => togglePinToolMutation.mutate({ toolId: entry.toolId })}>
            <Pin className="mr-1.5 h-3.5 w-3.5" />
            {entry.pinned ? '取消置顶' : '置顶'}
          </Button>
          <Button type="button" variant="outline" className="h-9 rounded-full bg-white px-3 text-xs" onClick={() => togglePurchasedToolMutation.mutate({ toolId: entry.toolId })}>
            <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
            {entry.purchased ? '取消已购' : '标记已购'}
          </Button>
          <Button type="button" variant="outline" className="h-9 rounded-full bg-white px-3 text-xs" onClick={() => removeToolFromPocketMutation.mutate({ toolId: entry.toolId })}>
            移出收藏
          </Button>
          {tool.url ? (
            <Button type="button" className="h-9 rounded-full px-3 text-xs" onClick={() => toolCardActions.openTool(entry.toolId)}>
              打开
              <ExternalLink className="ml-1 h-3.5 w-3.5" />
            </Button>
          ) : (
            <Button asChild className="h-9 rounded-full px-3 text-xs">
              <Link href="/">回分析页调用</Link>
            </Button>
          )}
        </div>
      </div>
    </article>
  )

  return (
    <PageShell
      header={
        <UnifiedTopBar
          title="DoraPocket · 我的口袋"
          subtitle="把你从市场里挑中的工具收进来，沉淀成自己的可复用入口。"
          rightSlot={
            <div className="flex items-center gap-2">
              <TopNavSwitch current="pocket" />
              <ProfileEntryPill />
            </div>
          }
        />
      }
    >
      <section className="rounded-[2rem] border border-white/80 bg-white/90 p-4 shadow-xl shadow-slate-900/8 backdrop-blur-xl">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索我收藏的工具…"
              className="h-10 w-full rounded-full border border-border/70 bg-background pl-11 pr-4 text-sm outline-none ring-primary/30 placeholder:text-muted-foreground focus-visible:ring-2"
            />
          </div>
        </div>
      </section>

      {activeItems.length === 0 ? (
        <section className="rounded-[2rem] border border-white/80 bg-white/90 p-8 text-center shadow-xl shadow-slate-900/8 backdrop-blur-xl">
          <p className="text-lg font-black text-foreground">你的工具收藏夹还是空的</p>
          <p className="mt-2 text-sm text-muted-foreground">先去市场看看，把你想留着以后再用的工具收进来。</p>
          <Button asChild className="mt-5 h-10 rounded-full px-4 text-xs font-bold">
            <Link href="/market">去市场收藏工具</Link>
          </Button>
        </section>
      ) : (
        <>
          {pinnedTools.length > 0 ? (
            <section className="rounded-[2rem] border border-white/80 bg-white/90 p-5 shadow-xl shadow-slate-900/8 backdrop-blur-xl">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">Pinned</p>
                  <h2 className="mt-1 text-2xl font-black text-foreground">置顶</h2>
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{pinnedTools.map(renderPocketCard)}</div>
            </section>
          ) : null}

          <section className="rounded-[2rem] border border-white/80 bg-white/90 p-5 shadow-xl shadow-slate-900/8 backdrop-blur-xl">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">Collection</p>
                <h2 className="mt-1 text-2xl font-black text-foreground">全部收藏</h2>
              </div>
            </div>
            {allCollectedTools.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-border bg-slate-50 p-8 text-center text-sm font-semibold text-muted-foreground">
                没有找到匹配当前搜索的收藏工具。
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{allCollectedTools.map(renderPocketCard)}</div>
            )}
          </section>
        </>
      )}

      {archivedTools.length > 0 ? (
        <section className="rounded-[2rem] border border-white/80 bg-white/90 p-5 shadow-xl shadow-slate-900/8 backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">Archived</p>
              <h2 className="mt-1 text-2xl font-black text-foreground">归档</h2>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {archivedTools.map(({ entry, tool }) => (
              <article key={entry.toolId} className="flex min-h-48 flex-col rounded-3xl border border-border/60 bg-slate-50 p-4">
                <div className="min-w-0">
                  <p className="text-lg font-black text-foreground">{tool.icon} {tool.name}</p>
                  <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-muted-foreground">{tool.description}</p>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {entry.purchased ? <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold text-emerald-800">已购入</span> : null}
                </div>
                <div className="mt-auto pt-4 flex flex-wrap gap-2">
                  <Button type="button" variant="outline" className="h-9 rounded-full bg-white px-3 text-xs" onClick={() => toggleArchiveToolMutation.mutate({ toolId: entry.toolId })}>
                    取消归档
                  </Button>
                  <Button type="button" variant="outline" className="h-9 rounded-full bg-white px-3 text-xs" onClick={() => removeToolFromPocketMutation.mutate({ toolId: entry.toolId })}>
                    删除
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </PageShell>
  )
}
