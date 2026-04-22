import { useMemo, useState } from 'react'
import { ExternalLink, Pin, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getToolById, resolveToolUrlById } from '@/services/tool-registry'
import { useStore } from '@/store'

type PocketCollectionPanelProps = {
  title?: string
  description?: string
}

export function PocketCollectionPanel({
  title = '复用口袋',
  description = '这里不是收藏夹，而是下次不用再选一遍的能力入口',
}: PocketCollectionPanelProps) {
  const [query, setQuery] = useState('')
  const { pocketInventory, removeToolFromPocket, togglePinTool, markToolUsed } = useStore()

  const pocketTools = useMemo(() => {
    const lower = query.trim().toLowerCase()
    return pocketInventory
      .map((entry) => ({ entry, tool: getToolById(entry.toolId) }))
      .filter((item) => item.tool && item.tool.status === 'active')
      .filter((item) => {
        if (!lower) return true
        return (
          item.tool!.name.toLowerCase().includes(lower) ||
          item.tool!.tags.some((tag) => tag.toLowerCase().includes(lower))
        )
      })
  }, [pocketInventory, query])

  const openTool = (toolId: string) => {
    const url = resolveToolUrlById(toolId)
    if (!url) return
    markToolUsed(toolId)
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <article className="rounded-3xl border border-border/70 bg-card/90 p-4 shadow-sm sm:p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-sans text-base font-bold sm:text-lg">{title}</p>
          <p className="font-sans text-xs text-muted-foreground sm:text-sm">{description}</p>
        </div>
        <span className="rounded-full border border-border/70 bg-background px-2.5 py-1 text-xs font-semibold text-muted-foreground">
          {pocketTools.length} 个
        </span>
      </div>

      <div className="relative mb-3">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜索可复用工具..."
          className="h-10 w-full rounded-full border border-border/70 bg-background pl-9 pr-3 text-sm outline-none ring-primary/30 placeholder:text-muted-foreground focus-visible:ring-2"
        />
      </div>

      {pocketTools.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-background/70 p-6 text-center font-sans text-sm text-muted-foreground">
          口袋里还没有可复用资产。完成一次裁决后，把高价值工具沉淀进来。
        </div>
      ) : (
        <div className="space-y-3">
          {pocketTools.map(({ entry, tool }) => (
            <div
              key={entry.toolId}
              className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-background p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="truncate font-sans text-sm font-semibold text-foreground">{tool!.name}</p>
                  {entry.pinned ? (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                      置顶
                    </span>
                  ) : null}
                </div>
                <p className="mt-0.5 line-clamp-2 font-sans text-xs text-muted-foreground">
                  {tool!.description}
                </p>
                <p className="mt-1 font-sans text-[11px] text-muted-foreground">
                  使用 {entry.useCount} 次 · 最近{new Date(entry.lastUsedAt).toLocaleDateString('zh-CN')}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="h-9 rounded-full px-3 text-xs"
                  onClick={() => togglePinTool(entry.toolId)}
                >
                  <Pin className="mr-1 h-3.5 w-3.5" />
                  {entry.pinned ? '取消置顶' : '置顶'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-9 rounded-full px-3 text-xs"
                  onClick={() => removeToolFromPocket(entry.toolId)}
                >
                  移除
                </Button>
                <Button
                  type="button"
                  className="h-9 rounded-full px-3 text-xs"
                  onClick={() => openTool(entry.toolId)}
                >
                  打开
                  <ExternalLink className="ml-1 h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </article>
  )
}
