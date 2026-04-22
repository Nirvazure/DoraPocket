import { useEffect } from 'react'
import { ConversationPanel } from '@/components/conversation-panel'
import { UnifiedTopBar } from '@/components/common/unified-top-bar'
import { useStore } from '@/store'
import { getToolById } from '@/services/tool-registry'

type Props = {
  open: boolean
  onClose: () => void
}

export function UserCenterPage({ open, onClose }: Props) {
  const { transcript, botResponse, lastSpeechError, pocketInventory } = useStore()

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const activePocketItems = pocketInventory.filter((item) => !item.archived)
  const pinnedCount = activePocketItems.filter((item) => item.pinned).length
  const reusableCount = activePocketItems.filter((item) => item.presetArgs && Object.keys(item.presetArgs).length > 0).length
  const recentTools = activePocketItems
    .slice(0, 5)
    .map((entry) => ({ entry, tool: getToolById(entry.toolId) }))
    .filter((item) => item.tool)
  const totalUses = pocketInventory.reduce((sum, item) => sum + item.useCount, 0)
  const topTool = recentTools[0]
  const learningFeeds = [
    {
      source: '口袋资产',
      title: pinnedCount > 0 ? '你有明确的高频入口' : '还在建立高频入口',
      detail:
        pinnedCount > 0
          ? `已有 ${pinnedCount} 个置顶资产，类似任务会更优先参考这些入口。`
          : '当你置顶常用工具后，DoraPocket 会更快判断哪些帮助适合先拿出来。',
    },
    {
      source: '复用行为',
      title: reusableCount > 0 ? '你偏好能少填参数的路径' : '可复用参数还不多',
      detail:
        reusableCount > 0
          ? `${reusableCount} 个入口已经记住参数，下次推荐会更重视可直接再用的帮助。`
          : '当某个工具带着任务参数被复用，它会比普通收藏更能影响排序。',
    },
    {
      source: '使用沉淀',
      title: totalUses > 0 ? '真实调用正在回流排序' : '还缺少真实调用信号',
      detail:
        totalUses > 0
          ? `累计 ${totalUses} 次调用会帮助系统判断哪些帮助真的被用起来。`
          : '打开、复用、跳过和归档会比单纯点赞更能说明什么适合你。',
    },
    {
      source: '数据边界',
      title: '当前优先本地记忆',
      detail: '口袋和市场反馈优先保存在本地浏览器，用来跑通越用越准的 MVP 闭环。',
    },
  ]

  return (
    <div className="fixed inset-0 z-[66]">
      <div className="absolute inset-0 bg-slate-950/55 backdrop-blur-[4px]" aria-hidden />
      <section
        className="relative z-[1] flex h-full w-full flex-col bg-background/95 motion-safe:animate-dp-page-in"
        role="dialog"
        aria-modal="true"
        aria-label="成长与偏好"
      >
        <UnifiedTopBar title="成长与偏好" subtitle="这里接住首页移出的资产概览，并解释系统为什么越来越懂你。" onBack={onClose} />

        <main className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
          <div className="mx-auto w-full max-w-7xl space-y-4">
            <article className="overflow-hidden rounded-[2rem] border border-primary/15 bg-slate-950 p-5 text-white shadow-xl shadow-slate-950/10 sm:p-6">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/62">DoraPocket Memory</p>
              <h2 className="mt-3 max-w-4xl text-3xl font-black leading-tight tracking-tight sm:text-4xl">
                已记住 {pocketInventory.length} 个可复用入口
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-white/72">
                {topTool?.tool?.name
                  ? `最近更常复用 ${topTool.tool.name}。下次遇到类似任务，DoraPocket 会优先参考这些口袋资产和真实调用信号。`
                  : '完成一次裁决并把高价值帮助放进口袋后，这里会展示系统正在如何变得更懂你。'}
              </p>
            </article>

            <div className="grid gap-3 md:grid-cols-4">
              {[
                { label: '口袋资产', value: pocketInventory.length, hint: '下次可直接复用' },
                { label: '置顶工具', value: pinnedCount, hint: '高频优先入口' },
                { label: '已记参数', value: reusableCount, hint: '下次少填一遍' },
                { label: '累计调用', value: totalUses, hint: '真实使用沉淀' },
              ].map((item) => (
                <article key={item.label} className="rounded-3xl border border-border/70 bg-card/90 p-4 shadow-sm">
                  <p className="text-xs font-semibold text-muted-foreground">{item.label}</p>
                  <p className="mt-2 text-2xl font-black text-foreground">{item.value}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{item.hint}</p>
                </article>
              ))}
            </div>

            <div className="grid gap-4 lg:grid-cols-[1fr,1fr]">
              <article className="rounded-3xl border border-border/70 bg-card/90 p-4 shadow-sm sm:p-5">
                <div className="mb-3">
                  <p className="text-base font-bold text-foreground sm:text-lg">DoraPocket 学到了什么</p>
                  <p className="text-xs text-muted-foreground sm:text-sm">这些信号会影响下一次裁决，而不是停留在静态资料里。</p>
                </div>
                <div className="space-y-3">
                  {learningFeeds.map((item) => (
                    <div key={item.source} className="rounded-2xl border border-border/70 bg-background p-3">
                      <div className="flex items-start gap-3">
                        <span className="mt-0.5 rounded-full border border-primary/15 bg-primary/[0.06] px-2 py-0.5 text-[10px] font-bold text-primary">
                          {item.source}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-black text-foreground">{item.title}</p>
                          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{item.detail}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </article>

              <article className="rounded-3xl border border-border/70 bg-card/90 p-4 shadow-sm sm:p-5">
                <div className="mb-3">
                  <p className="text-base font-bold text-foreground sm:text-lg">复用资产流</p>
                  <p className="text-xs text-muted-foreground sm:text-sm">最近沉淀的帮助，会变成下次更省事的入口。</p>
                </div>
                {recentTools.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border bg-background/70 p-6 text-center text-sm text-muted-foreground">
                    还没有口袋资产。完成一次工具推荐后，可以把高价值工具沉淀进来。
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentTools.map(({ entry, tool }) => (
                      <div key={entry.toolId} className="rounded-2xl border border-border/70 bg-background p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="truncate text-sm font-semibold text-foreground">{tool?.name}</p>
                              {entry.pinned ? <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">置顶</span> : null}
                              {entry.presetArgs && Object.keys(entry.presetArgs).length > 0 ? <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">记住参数</span> : null}
                            </div>
                            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{tool?.description}</p>
                          </div>
                          <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-semibold text-primary">
                            {entry.useCount} 次
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </article>
            </div>

            <section className="rounded-3xl border border-border/70 bg-card/70 p-4 shadow-sm sm:p-5">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-base font-bold text-foreground sm:text-lg">最近对话记录</p>
                  <p className="text-xs text-muted-foreground sm:text-sm">仅作为回看，不参与这里的主信息流。</p>
                </div>
                {lastSpeechError ? <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-800">语音提示</span> : null}
              </div>
              <ConversationPanel
                transcript={transcript}
                botResponse={botResponse}
                lastSpeechError={lastSpeechError}
                className="h-fit border border-border/70 bg-background/80 shadow-sm"
                bodyClassName="flex min-h-0 flex-col"
              />
            </section>
          </div>
        </main>
      </section>
    </div>
  )
}
