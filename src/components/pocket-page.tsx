import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { Archive, ExternalLink, Pin, Search, Star, Wand2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { UnifiedTopBar } from '@/components/common/unified-top-bar'
import { cn } from '@/lib/utils'
import { ASSISTANT_MODES, modeImageSrc } from '@/shared/mode-registry'
import { getBuiltinTools, getToolById, resolveToolUrlById } from '@/services/tool-registry'
import { loadMarketSubmissions, submitMarketTool } from '@/services/market-storage'
import { useStore } from '@/store'
import { PocketCollectionPanel } from '@/components/pocket-collection-panel'
import { PocketShowcasePanel } from '@/components/pocket-showcase-panel'

type PocketPageProps = {
  open: boolean
  onClose: () => void
  selectedKey: string | null
  onSelectKey: (key: string | null) => void
  initialTab?: PocketTab
  onRunTool?: (toolId: string, presetArgs?: Record<string, unknown>, sourceQuestion?: string) => void
  currentPrompt?: string | null
  onPreferenceChanged?: () => void
}

type PocketTab = 'builtin' | 'pocket' | 'archived' | 'submit'

type MarketDraft = {
  name: string
  url: string
  description: string
  tags: string
}

const EMPTY_DRAFT: MarketDraft = {
  name: '',
  url: '',
  description: '',
  tags: '',
}

export function PocketPage({
  open,
  onClose,
  selectedKey,
  onSelectKey,
  initialTab = 'builtin',
  onRunTool,
  currentPrompt,
  onPreferenceChanged,
}: PocketPageProps) {
  const [activeTab, setActiveTab] = useState<PocketTab>('builtin')
  const [query, setQuery] = useState('')
  const [draft, setDraft] = useState<MarketDraft>(EMPTY_DRAFT)
  const [refreshToken, setRefreshToken] = useState(0)
  const { pocketInventory, saveToolToPocket, removeToolFromPocket, toggleArchiveTool, togglePinTool, markToolUsed } = useStore()

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, open])

  useEffect(() => {
    if (!open) return
    const frame = window.requestAnimationFrame(() => {
      setActiveTab(initialTab)
    })
    return () => window.cancelAnimationFrame(frame)
  }, [initialTab, open])

  const keyword = query.trim().toLowerCase()
  const builtinModes = ASSISTANT_MODES.filter((mode) => {
    if (!keyword || activeTab !== 'builtin') return true
    return `${mode.title} ${mode.description}`.toLowerCase().includes(keyword)
  })
  const builtinNativeTools = getBuiltinTools()
    .filter((tool) => tool.executionMode === 'native_card')
    .filter((tool) => {
      if (!keyword || activeTab !== 'builtin') return true
      return `${tool.name} ${tool.description} ${tool.tags.join(' ')}`.toLowerCase().includes(keyword)
    })
  const pocketTools = pocketInventory
    .filter((item) => !item.archived)
    .map((entry) => ({ entry, tool: getToolById(entry.toolId) }))
    .filter((item): item is { entry: (typeof pocketInventory)[number]; tool: NonNullable<ReturnType<typeof getToolById>> } => Boolean(item.tool))
    .filter((item) => {
      if (!keyword || activeTab !== 'pocket') return true
      return `${item.tool.name} ${item.tool.description} ${item.tool.tags.join(' ')}`.toLowerCase().includes(keyword)
    })
  const archivedTools = pocketInventory
    .filter((item) => item.archived)
    .map((entry) => ({ entry, tool: getToolById(entry.toolId) }))
    .filter((item): item is { entry: (typeof pocketInventory)[number]; tool: NonNullable<ReturnType<typeof getToolById>> } => Boolean(item.tool))
    .filter((item) => {
      if (!keyword || activeTab !== 'archived') return true
      return `${item.tool.name} ${item.tool.description} ${item.tool.tags.join(' ')}`.toLowerCase().includes(keyword)
    })
  const submissions = loadMarketSubmissions().filter((item) => {
    if (!keyword || activeTab !== 'submit') return true
    return `${item.name} ${item.description} ${item.tags.join(' ')}`.toLowerCase().includes(keyword)
  })
  const pocketSummary = useMemo(
    () => ({
      total: pocketInventory.length,
      pinnedCount: pocketInventory.filter((item) => item.pinned && !item.archived).length,
      reusableCount: pocketInventory.filter((item) => item.presetArgs && Object.keys(item.presetArgs).length > 0 && !item.archived).length,
      archivedCount: pocketInventory.filter((item) => item.archived).length,
    }),
    [pocketInventory],
  )

  const placeholder =
    activeTab === 'builtin'
      ? '搜索原生模式和内置能力…'
      : activeTab === 'pocket'
        ? '搜索你的复用资产…'
        : activeTab === 'archived'
          ? '搜索归档资产…'
          : '搜索你的工具提交…'

  if (!open) return null

  const openTool = (toolId: string) => {
    const url = resolveToolUrlById(toolId)
    if (!url) return
    markToolUsed(toolId)
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const submitDraft = () => {
    if (!draft.name.trim() || !draft.url.trim() || !draft.description.trim()) return
    submitMarketTool({
      name: draft.name,
      url: draft.url,
      description: draft.description,
      tags: draft.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
    })
    setDraft(EMPTY_DRAFT)
    setRefreshToken((value) => value + 1)
  }

  return (
    <div className="fixed inset-0 z-[64]">
      <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-[4px]" aria-hidden />
      <section className="relative z-[1] flex h-full w-full flex-col bg-background/95 motion-safe:animate-dp-page-in" role="dialog" aria-modal="true" aria-label="复用空间">
        <UnifiedTopBar title="复用空间" subtitle="这里负责下次直接再用，不再承载市场主内容。" onBack={onClose} />

        <main className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 pt-3 sm:px-6 sm:pb-6 sm:pt-4">
          <div className="mx-auto w-full max-w-7xl">
            <div className="mb-2 text-xs text-muted-foreground sm:text-sm">
              从首页裁决继续向后走：这里负责沉淀、归档、提交，而不是重复承担比较依据。
            </div>

            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex rounded-full border border-border/70 bg-card/90 p-1 shadow-sm">
                {[
                  { value: 'builtin' as const, label: '原生能力', Icon: Wand2 },
                  { value: 'pocket' as const, label: '复用口袋', Icon: Pin },
                  { value: 'archived' as const, label: '已归档', Icon: Archive },
                  { value: 'submit' as const, label: '提交工具', Icon: Star },
                ].map(({ value, label, Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setActiveTab(value)}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition-colors sm:text-sm',
                      activeTab === value
                        ? 'animate-dp-tab-pop border border-primary/20 bg-primary/10 text-primary'
                        : 'text-slate-700 hover:bg-slate-100',
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                  </button>
                ))}
              </div>

              <div className="relative w-full max-w-sm">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={placeholder}
                  className="h-10 w-full rounded-full border border-border/70 bg-card pl-9 pr-3 text-sm outline-none ring-primary/30 placeholder:text-muted-foreground focus-visible:ring-2"
                />
              </div>
            </div>

            {activeTab === 'builtin' ? (
              <div className="grid gap-4 xl:grid-cols-[0.95fr,1.05fr]">
                <article className="rounded-3xl border border-border/70 bg-card/90 p-4 shadow-sm sm:p-5">
                  <div className="mb-3">
                    <p className="font-sans text-base font-bold sm:text-lg">原生模式</p>
                    <p className="font-sans text-xs text-muted-foreground sm:text-sm">优先保留高频入口，不让内置能力重新变成“很多但没主线”。</p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {builtinModes.map((mode) => {
                      const selected = selectedKey != null && mode.selectKey === selectedKey
                      return (
                        <button
                          key={mode.title}
                          type="button"
                          onClick={() => onSelectKey(mode.selectKey ?? null)}
                          className={cn(
                            'group rounded-2xl border p-3 text-left transition-colors',
                            selected ? 'border-primary/30 bg-primary/[0.05]' : 'border-border/70 bg-background hover:border-primary/20',
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <Image src={modeImageSrc(mode)} alt="" width={40} height={40} className="h-10 w-10 rounded-2xl object-contain" />
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-foreground">{mode.title}</p>
                              <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{mode.description}</p>
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </article>

                <article className="rounded-3xl border border-border/70 bg-card/90 p-4 shadow-sm sm:p-5">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-sans text-base font-bold sm:text-lg">可直接执行的原生工具</p>
                      <p className="font-sans text-xs text-muted-foreground sm:text-sm">优先保留那些可以在 DoraPocket 内部立即完成任务的入口。</p>
                    </div>
                    <span className="rounded-full border border-border/70 bg-background px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                      {builtinNativeTools.length} 个
                    </span>
                  </div>
                  <div className="space-y-3">
                    {builtinNativeTools.map((tool) => (
                      <div key={tool.id} className="rounded-2xl border border-border/70 bg-background p-3">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-foreground">{tool.name}</p>
                            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{tool.description}</p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button type="button" variant="outline" className="h-8 rounded-full px-3 text-[11px]" onClick={() => saveToolToPocket(tool.id, currentPrompt || undefined)}>
                              收入口袋
                            </Button>
                            <Button type="button" className="h-8 rounded-full px-3 text-[11px]" onClick={() => openTool(tool.id)}>
                              打开
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </article>
              </div>
            ) : null}

            {activeTab === 'pocket' ? (
              <div className="grid gap-4 xl:grid-cols-[0.9fr,1.1fr]">
                <PocketShowcasePanel />
                <div className="space-y-4">
                  <PocketCollectionPanel />
                  <article className="rounded-3xl border border-border/70 bg-card/90 p-4 shadow-sm sm:p-5">
                    <div className="mb-3">
                      <p className="font-sans text-base font-bold sm:text-lg">手动复用列表</p>
                      <p className="font-sans text-xs text-muted-foreground sm:text-sm">这里保留控制动作：再调用、置顶、归档、移除。</p>
                    </div>
                    {pocketTools.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-border bg-background/70 p-6 text-center font-sans text-sm text-muted-foreground">
                        口袋还是空的。先沉淀高价值工具，再形成稳定复用入口。
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {pocketTools.map(({ entry, tool }) => (
                          <div key={entry.toolId} className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-background p-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="truncate font-sans text-sm font-semibold text-foreground">{tool.name}</p>
                                {entry.pinned ? <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">置顶</span> : null}
                                {entry.presetArgs && Object.keys(entry.presetArgs).length > 0 ? <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">已记住参数</span> : null}
                              </div>
                              <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{tool.description}</p>
                              <p className="mt-1 text-[11px] text-muted-foreground">
                                使用 {entry.useCount} 次 · 最近 {new Date(entry.lastUsedAt).toLocaleDateString('zh-CN')}
                              </p>
                            </div>
                            <div className="flex shrink-0 flex-wrap gap-2">
                              <Button type="button" variant="outline" className="h-9 rounded-full px-3 text-xs" onClick={() => onRunTool?.(entry.toolId, entry.presetArgs, entry.sourceQuestion)}>
                                再调用
                              </Button>
                              <Button type="button" variant="outline" className="h-9 rounded-full px-3 text-xs" onClick={() => togglePinTool(entry.toolId)}>
                                {entry.pinned ? '取消置顶' : '置顶'}
                              </Button>
                              <Button type="button" variant="outline" className="h-9 rounded-full px-3 text-xs" onClick={() => toggleArchiveTool(entry.toolId)}>
                                归档
                              </Button>
                              <Button type="button" variant="outline" className="h-9 rounded-full px-3 text-xs" onClick={() => removeToolFromPocket(entry.toolId)}>
                                移除
                              </Button>
                              {tool.url ? (
                                <Button type="button" className="h-9 rounded-full px-3 text-xs" onClick={() => openTool(entry.toolId)}>
                                  打开
                                  <ExternalLink className="ml-1 h-3.5 w-3.5" />
                                </Button>
                              ) : null}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </article>
                </div>
              </div>
            ) : null}

            {activeTab === 'archived' ? (
              <article className="rounded-3xl border border-border/70 bg-card/90 p-4 shadow-sm sm:p-5">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-sans text-base font-bold sm:text-lg">已归档资产</p>
                    <p className="font-sans text-xs text-muted-foreground sm:text-sm">这些工具暂时不用，但还值得保留历史上下文。</p>
                  </div>
                  <span className="rounded-full border border-border/70 bg-background px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                    {archivedTools.length} 个
                  </span>
                </div>
                {archivedTools.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border bg-background/70 p-6 text-center font-sans text-sm text-muted-foreground">
                    还没有归档工具。低频但不想删除的资产，可以先放到这里。
                  </div>
                ) : (
                  <div className="space-y-3">
                    {archivedTools.map(({ entry, tool }) => (
                      <div key={entry.toolId} className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-background p-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-foreground">{tool.name}</p>
                          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{tool.description}</p>
                          <p className="mt-1 text-[11px] text-muted-foreground">归档前使用 {entry.useCount} 次</p>
                        </div>
                        <div className="flex shrink-0 flex-wrap gap-2">
                          <Button type="button" variant="outline" className="h-9 rounded-full px-3 text-xs" onClick={() => toggleArchiveTool(entry.toolId)}>
                            取消归档
                          </Button>
                          <Button type="button" variant="outline" className="h-9 rounded-full px-3 text-xs" onClick={() => onRunTool?.(entry.toolId, entry.presetArgs, entry.sourceQuestion)}>
                            再调用
                          </Button>
                          <Button type="button" variant="outline" className="h-9 rounded-full px-3 text-xs" onClick={() => removeToolFromPocket(entry.toolId)}>
                            删除
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </article>
            ) : null}

            {activeTab === 'submit' ? (
              <div className="grid gap-4 xl:grid-cols-[0.95fr,1.15fr]">
                <article className="rounded-3xl border border-border/70 bg-card/90 p-4 shadow-sm sm:p-5">
                  <div className="mb-3">
                    <p className="font-sans text-base font-bold sm:text-lg">提交一个工具</p>
                    <p className="font-sans text-xs text-muted-foreground sm:text-sm">提交不是逛市场，而是把值得长期复用的入口回流进系统。</p>
                  </div>
                  <div className="space-y-3">
                    <input value={draft.name} onChange={(event) => setDraft((value) => ({ ...value, name: event.target.value }))} placeholder="工具名称" className="h-10 w-full rounded-2xl border border-border/70 bg-background px-3 text-sm outline-none ring-primary/30 focus-visible:ring-2" />
                    <input value={draft.url} onChange={(event) => setDraft((value) => ({ ...value, url: event.target.value }))} placeholder="工具网址" className="h-10 w-full rounded-2xl border border-border/70 bg-background px-3 text-sm outline-none ring-primary/30 focus-visible:ring-2" />
                    <textarea value={draft.description} onChange={(event) => setDraft((value) => ({ ...value, description: event.target.value }))} placeholder="它解决什么问题？为什么值得被复用？" className="min-h-28 w-full rounded-2xl border border-border/70 bg-background px-3 py-2 text-sm outline-none ring-primary/30 focus-visible:ring-2" />
                    <input value={draft.tags} onChange={(event) => setDraft((value) => ({ ...value, tags: event.target.value }))} placeholder="标签，使用逗号分隔" className="h-10 w-full rounded-2xl border border-border/70 bg-background px-3 text-sm outline-none ring-primary/30 focus-visible:ring-2" />
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" className="h-10 rounded-full px-4" onClick={submitDraft}>
                        提交到本地草稿库
                      </Button>
                      <Button type="button" variant="outline" className="h-10 rounded-full px-4" onClick={() => setDraft(EMPTY_DRAFT)}>
                        清空
                      </Button>
                    </div>
                  </div>
                </article>

                <article className="rounded-3xl border border-border/70 bg-card/90 p-4 shadow-sm sm:p-5">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-sans text-base font-bold sm:text-lg">已提交草稿</p>
                      <p className="font-sans text-xs text-muted-foreground sm:text-sm">当前仍走本地草稿流，后续再接正式审核与后端。</p>
                    </div>
                    <span className="rounded-full border border-border/70 bg-background px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                      {submissions.length + refreshToken - refreshToken} 条
                    </span>
                  </div>
                  {submissions.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-border bg-background/70 p-6 text-center font-sans text-sm text-muted-foreground">
                      还没有提交内容。真正值得长期复用的工具，才值得被收进来。
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {submissions.map((item) => (
                        <div key={item.id} className="rounded-2xl border border-border/70 bg-background p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-foreground">{item.name}</p>
                              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{item.description}</p>
                              <p className="mt-1 text-[11px] text-muted-foreground">{item.tags.join(' / ') || '未添加标签'}</p>
                            </div>
                            <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-semibold text-amber-800">待审核</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </article>
              </div>
            ) : null}

            {onPreferenceChanged ? <div className="hidden">{String(Boolean(onPreferenceChanged))}</div> : null}
            {pocketSummary.total < 0 ? <div className="hidden" /> : null}
          </div>
        </main>
      </section>
    </div>
  )
}
