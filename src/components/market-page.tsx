'use client'

import { useMemo, useState } from 'react'
import { ExternalLink, FolderOpenDot, Plus, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ProfileEntryPill } from '@/components/common/profile-entry-pill'
import { PageShell } from '@/components/common/page-shell'
import { TopNavSwitch } from '@/components/common/top-nav-switch'
import { UnifiedTopBar } from '@/components/common/unified-top-bar'
import { MarketToolIcon } from '@/components/market/market-tool-icon'
import { cn } from '@/lib/utils'
import { useToolCardActions } from '@/hooks/use-tool-card-actions'
import { useMarkToolUsedMutation, useSaveToolToPocketMutation } from '@/lib/query/pocket'
import { useSubmitMarketToolMutation } from '@/lib/query/market'
import { getActiveTools, type ToolCategory, type ToolItem } from '@/services/tool-registry'

const CATEGORY_LABELS: Record<ToolCategory, string> = {
  ai_assistant: 'AI 助手',
  search: '搜索研究',
  developer: '开发者工具',
  design: '设计素材',
  productivity: '效率办公',
  media: '媒体处理',
  learning: '学习资料',
  writing: '写作翻译',
}

const SOURCE_LABELS: Record<ToolItem['source'], string> = {
  builtin: '原生能力',
  market: '市场精选',
  submitted: '用户提交',
  imported: '导入工具',
  external_resource: '参考资源',
  official: '官方资源',
}

type Draft = {
  name: string
  url: string
  description: string
  tags: string
}

const EMPTY_DRAFT: Draft = {
  name: '',
  url: '',
  description: '',
  tags: '',
}

function groupTools(tools: ToolItem[]) {
  return tools.reduce<Record<ToolCategory, ToolItem[]>>(
    (groups, tool) => {
      groups[tool.category].push(tool)
      return groups
    },
    {
      ai_assistant: [],
      search: [],
      developer: [],
      design: [],
      productivity: [],
      media: [],
      learning: [],
      writing: [],
    },
  )
}

export function MarketPage() {
  const [query, setQuery] = useState('')
  const [submitOpen, setSubmitOpen] = useState(false)
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT)
  const [selectedSection, setSelectedSection] = useState<'builtin' | ToolCategory>('builtin')
  const saveToolToPocketMutation = useSaveToolToPocketMutation()
  const markToolUsedMutation = useMarkToolUsedMutation()
  const submitMarketToolMutation = useSubmitMarketToolMutation()
  const toolCardActions = useToolCardActions({
    markToolUsed: markToolUsedMutation.mutate,
    saveToolToPocket: saveToolToPocketMutation.mutate,
    getSourceQuestion: () => '从市场页收入口袋',
  })

  const keyword = query.trim().toLowerCase()
  const tools = useMemo(() => {
    const activeTools = getActiveTools()
    if (!keyword) return activeTools
    return activeTools.filter((tool) =>
      `${tool.name} ${tool.description} ${tool.tags.join(' ')} ${CATEGORY_LABELS[tool.category]}`
        .toLowerCase()
        .includes(keyword),
    )
  }, [keyword])
  const builtinTools = useMemo(() => tools.filter((tool) => tool.source === 'builtin'), [tools])
  const marketTools = useMemo(() => tools.filter((tool) => tool.source !== 'builtin'), [tools])
  const grouped = groupTools(marketTools)
  const categoryCounts = useMemo(
    () => ({
      builtin: builtinTools.length,
      ai_assistant: grouped.ai_assistant.length,
      search: grouped.search.length,
      developer: grouped.developer.length,
      design: grouped.design.length,
      productivity: grouped.productivity.length,
      media: grouped.media.length,
      learning: grouped.learning.length,
      writing: grouped.writing.length,
    }),
    [builtinTools.length, grouped],
  )
  const categoryEntries = ([
    ['builtin', '内置工具'],
    ['ai_assistant', 'AI 助手'],
    ['search', '搜索研究'],
    ['developer', '开发者工具'],
    ['design', '设计素材'],
    ['productivity', '效率办公'],
    ['media', '媒体处理'],
    ['learning', '学习资料'],
    ['writing', '写作翻译'],
  ] as const).filter(([key]) => categoryCounts[key] > 0)
  const currentCategoryTools = selectedSection === 'builtin' ? builtinTools : grouped[selectedSection]

  const submitDraft = () => {
    if (!draft.name.trim() || !draft.url.trim() || !draft.description.trim()) return
    submitMarketToolMutation.mutate({
      name: draft.name,
      url: draft.url,
      description: draft.description,
      tags: draft.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
    })
    setDraft(EMPTY_DRAFT)
    setSubmitOpen(false)
  }

  return (
    <PageShell
      className="overflow-hidden"
      contentClassName="h-[calc(100dvh-5.25rem)] overflow-hidden pb-5 pt-5 sm:h-[calc(100dvh-5.75rem)] sm:pt-6 lg:h-[calc(100dvh-6.25rem)] lg:pt-6"
      header={
        <UnifiedTopBar
          title="DoraPocket · 市场页"
          subtitle="按类别浏览原生能力与优秀工具，不让市场变成无结论的工具海。"
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
        <aside className="hidden h-full overflow-hidden rounded-[2rem] border border-white/80 bg-white/92 p-4 shadow-xl shadow-slate-900/8 backdrop-blur-xl xl:block">
          <div className="rounded-[1.6rem] border border-border/60 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(240,247,255,0.96))] p-4 shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">Market Directory</p>
            <h2 className="mt-2 text-lg font-black text-foreground">市场导航</h2>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">从左侧切分类，右侧只负责展示当前展区的卡片结果。</p>
          </div>

          <div className="mt-4 space-y-2">
            {categoryEntries.map(([key, label]) => {
              const count = categoryCounts[key]
              const active = selectedSection === key
              return (
                <button
                  key={key}
                  type="button"
                  className={cn(
                    'flex w-full items-center justify-between rounded-2xl border px-3 py-3 text-left shadow-sm transition-all duration-200',
                    active
                      ? 'border-primary/15 bg-primary text-primary-foreground shadow-[0_12px_28px_rgba(37,99,235,0.18)]'
                      : 'border-border/60 bg-slate-50/95 hover:-translate-y-0.5 hover:border-primary/10 hover:bg-white',
                  )}
                  onClick={() => setSelectedSection(key)}
                >
                  <span className={cn('text-sm font-bold', active ? 'text-primary-foreground' : 'text-foreground')}>{label}</span>
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-[10px] font-semibold',
                      active ? 'bg-primary-foreground/15 text-primary-foreground' : 'bg-white text-muted-foreground',
                    )}
                  >
                    {count}
                  </span>
                </button>
              )
            })}
          </div>
        </aside>

        <div className="grid min-h-0 gap-4 xl:grid-rows-[auto_minmax(0,1fr)]">
          <section className="px-1">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="搜索工具、能力、标签或类别…"
                  className="h-10 w-full rounded-full border border-border/70 bg-background pl-11 pr-4 text-sm outline-none ring-primary/30 placeholder:text-muted-foreground focus-visible:ring-2"
                />
              </div>
              <Button type="button" size="sm" className="h-10 rounded-full px-3 text-xs font-bold" onClick={() => setSubmitOpen(true)}>
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                提交工具
              </Button>
            </div>

            <div className="relative xl:hidden">
              <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-6 bg-gradient-to-r from-white/95 to-transparent" />
              <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-6 bg-gradient-to-l from-white/95 to-transparent" />
              <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {categoryEntries.map(([key, label]) => {
                  const active = selectedSection === key
                  return (
                    <button
                      key={key}
                      type="button"
                      className={cn(
                        'inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-xs font-bold shadow-sm transition-all duration-200',
                        active
                          ? 'border-primary/15 bg-primary text-primary-foreground shadow-[0_10px_24px_rgba(37,99,235,0.22)]'
                          : 'border-white/80 bg-white/88 text-foreground/85 hover:border-primary/10 hover:bg-white',
                      )}
                      onClick={() => setSelectedSection(key)}
                    >
                      <span>{label}</span>
                      <span
                        className={cn(
                          'rounded-full px-1.5 py-0.5 text-[10px] font-semibold transition-colors',
                          active ? 'bg-primary-foreground/15 text-primary-foreground' : 'bg-slate-100 text-muted-foreground',
                        )}
                      >
                        {categoryCounts[key]}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          </section>

          <section className="min-h-0 overflow-y-auto rounded-[2rem] border border-white/80 bg-white/90 p-3 shadow-xl shadow-slate-900/8 backdrop-blur-xl sm:p-4">
            <div className="sticky top-0 z-10 -mx-3 mb-4 border-b border-white/80 bg-white/88 px-3 pb-3 pt-1 backdrop-blur-xl sm:-mx-4 sm:px-4">
              <div className="flex items-center justify-between gap-3 rounded-[1.4rem] border border-border/60 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(240,247,255,0.96))] px-4 py-3 shadow-sm">
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">Results</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-black text-foreground">
                      {selectedSection === 'builtin' ? '内置工具' : CATEGORY_LABELS[selectedSection]}
                    </h2>
                    <span className="rounded-full border border-primary/10 bg-primary/[0.08] px-2.5 py-1 text-[11px] font-semibold text-primary">
                      当前展区
                    </span>
                  </div>
                </div>
                <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-muted-foreground">
                  {currentCategoryTools.length} 个结果
                </span>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {currentCategoryTools.map((tool) => (
                <article key={tool.id} className="group flex min-h-56 flex-col rounded-3xl border border-border/60 bg-[linear-gradient(180deg,rgba(248,250,252,0.98),rgba(255,255,255,0.98))] p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/15 hover:bg-white hover:shadow-[0_14px_34px_rgba(15,23,42,0.08)]">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <MarketToolIcon tool={tool} />
                      <div className="min-w-0">
                        <p className="text-lg font-black text-foreground">{tool.name}</p>
                        <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-muted-foreground">{tool.description}</p>
                      </div>
                    </div>
                    <span
                      className={cn(
                        'shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold',
                        tool.source === 'builtin' ? 'bg-primary/10 text-primary' : 'bg-white text-muted-foreground',
                      )}
                    >
                      {SOURCE_LABELS[tool.source]}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {tool.tags.slice(0, 4).map((tag) => (
                      <span key={tag} className="rounded-full border border-white/80 bg-white px-2 py-0.5 text-[10px] font-semibold text-foreground/70 transition-colors group-hover:border-primary/10">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="mt-auto pt-4">
                    <p className="text-[11px] font-semibold text-muted-foreground">
                      推荐 {tool.ratingSummary.upvotes} · 打开 {tool.usageStats.opens} · {tool.executionMode === 'native_card' ? '站内小闭环' : '外部打开'}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="h-9 rounded-full bg-white px-3 text-xs"
                        onClick={() => toolCardActions.saveTool(tool.id)}
                      >
                        <FolderOpenDot className="mr-1.5 h-3.5 w-3.5" />
                        收入口袋
                      </Button>
                      {tool.url ? (
                        <Button type="button" className="h-9 rounded-full px-3 text-xs" onClick={() => toolCardActions.openTool(tool.id)}>
                          打开
                          <ExternalLink className="ml-1 h-3.5 w-3.5" />
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      </div>

      {submitOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-sm">
          <section className="w-full max-w-xl rounded-[2rem] border border-white/80 bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">Submit Tool</p>
                <h2 className="mt-1 text-2xl font-black text-foreground">提交一个值得推荐的工具</h2>
              </div>
              <button type="button" className="rounded-full p-2 text-muted-foreground hover:bg-slate-100 hover:text-foreground" onClick={() => setSubmitOpen(false)}>
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-4 space-y-3">
              <input value={draft.name} onChange={(event) => setDraft((value) => ({ ...value, name: event.target.value }))} placeholder="工具名称" className="h-10 w-full rounded-2xl border border-border/70 bg-background px-3 text-sm outline-none ring-primary/30 focus-visible:ring-2" />
              <input value={draft.url} onChange={(event) => setDraft((value) => ({ ...value, url: event.target.value }))} placeholder="工具网址" className="h-10 w-full rounded-2xl border border-border/70 bg-background px-3 text-sm outline-none ring-primary/30 focus-visible:ring-2" />
              <textarea value={draft.description} onChange={(event) => setDraft((value) => ({ ...value, description: event.target.value }))} placeholder="它解决什么问题？为什么值得被推荐？" className="min-h-28 w-full rounded-2xl border border-border/70 bg-background px-3 py-2 text-sm outline-none ring-primary/30 focus-visible:ring-2" />
              <input value={draft.tags} onChange={(event) => setDraft((value) => ({ ...value, tags: event.target.value }))} placeholder="标签，使用逗号分隔" className="h-10 w-full rounded-2xl border border-border/70 bg-background px-3 text-sm outline-none ring-primary/30 focus-visible:ring-2" />
            </div>
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <Button type="button" variant="outline" className="h-10 rounded-full px-4" onClick={() => setSubmitOpen(false)}>
                取消
              </Button>
              <Button type="button" className="h-10 rounded-full px-4" onClick={submitDraft}>
                提交到草稿库
              </Button>
            </div>
          </section>
        </div>
      ) : null}
    </PageShell>
  )
}
