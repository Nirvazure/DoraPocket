import { RotateCw, Sparkles, Star } from 'lucide-react'
import { getToolById } from '@/services/tool-registry'
import { useStore } from '@/store'

type PocketShowcasePanelProps = {
  title?: string
  description?: string
}

export function PocketShowcasePanel({
  title = '复用展示台',
  description = '这里优先展示真正能一键再用、已经记住参数、适合高频复用的工具入口。',
}: PocketShowcasePanelProps) {
  const { pocketInventory } = useStore()

  const activeEntries = pocketInventory.filter((item) => !item.archived)
  const pinnedEntries = activeEntries.filter((item) => item.pinned)
  const reusableEntries = activeEntries.filter((item) => item.presetArgs && Object.keys(item.presetArgs).length > 0)
  const topEntries = [...activeEntries]
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
      if (a.useCount !== b.useCount) return b.useCount - a.useCount
      return b.lastUsedAt - a.lastUsedAt
    })
    .slice(0, 3)
    .map((entry) => ({ entry, tool: getToolById(entry.toolId) }))
    .filter((item): item is { entry: typeof item.entry; tool: NonNullable<ReturnType<typeof getToolById>> } => Boolean(item.tool))

  return (
    <article className="rounded-3xl border border-border/70 bg-card/90 p-4 shadow-sm sm:p-5">
      <div className="mb-3">
        <p className="font-sans text-base font-bold sm:text-lg">{title}</p>
        <p className="font-sans text-xs text-muted-foreground sm:text-sm">{description}</p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {[
          { label: '高频入口', value: pinnedEntries.length, hint: '优先摆在手边' },
          { label: '已记住参数', value: reusableEntries.length, hint: '下次少填一遍' },
          { label: '最近活跃', value: topEntries.length, hint: '最近常被直接再用' },
          { label: '可继续提纯', value: Math.max(0, activeEntries.length - reusableEntries.length), hint: '还可继续固化调用方式' },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl border border-border/70 bg-background p-3">
            <p className="text-xs font-semibold text-foreground">{item.label}</p>
            <p className="mt-1 text-lg font-black text-primary">{item.value}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">{item.hint}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 space-y-2">
        {topEntries.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-background/70 p-5 text-center text-sm text-muted-foreground">
            还没有形成稳定复用入口。先把真正会再用的工具沉淀进口袋。
          </div>
        ) : (
          topEntries.map(({ entry, tool }) => (
            <div key={entry.toolId} className="rounded-2xl border border-border/70 bg-background p-3">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-foreground">{tool.name}</p>
                {entry.pinned ? (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                    <Star className="mr-1 inline h-3 w-3" />
                    高频位
                  </span>
                ) : null}
                {entry.presetArgs && Object.keys(entry.presetArgs).length > 0 ? (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                    <RotateCw className="mr-1 inline h-3 w-3" />
                    已记住参数
                  </span>
                ) : null}
              </div>
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{tool.description}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                使用 {entry.useCount} 次 · 最近 {new Date(entry.lastUsedAt).toLocaleDateString('zh-CN')}
              </p>
            </div>
          ))
        )}
      </div>

      <div className="mt-4 rounded-2xl border border-primary/15 bg-primary/[0.05] px-3 py-3 text-xs leading-relaxed text-foreground/80">
        <Sparkles className="mr-1 inline h-3.5 w-3.5 text-primary" />
        口袋的目标不是存更多，而是让你下次打开时少做一次选型、少填一次参数、少走一段路。
      </div>
    </article>
  )
}
