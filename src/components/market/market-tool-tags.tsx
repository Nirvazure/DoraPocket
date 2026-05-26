import { cn } from '@/lib/utils'

const TAG_ACCENT = [
  'bg-sky-500/[0.08] text-sky-700 ring-sky-500/15',
  'bg-violet-500/[0.08] text-violet-700 ring-violet-500/15',
  'bg-emerald-500/[0.08] text-emerald-700 ring-emerald-500/15',
  'bg-amber-500/[0.08] text-amber-700 ring-amber-500/15',
] as const

function formatToolTagLabel(tag: string) {
  return tag.replace(/-/g, ' ')
}

type MarketToolTagsProps = {
  tags: string[]
  className?: string
  max?: number
}

export function MarketToolTags({ tags, className, max = 2 }: MarketToolTagsProps) {
  const visibleTags = tags.slice(0, max)
  if (visibleTags.length === 0) return null

  return (
    <div className={cn('mt-1.5 flex flex-wrap items-center gap-1', className)}>
      {visibleTags.map((tag, index) => (
        <span
          key={tag}
          className={cn(
            'inline-flex max-w-full items-center rounded-md px-1.5 py-0.5 ring-1 ring-inset transition-colors duration-200',
            TAG_ACCENT[index % TAG_ACCENT.length],
            'group-hover:ring-current/25',
          )}
        >
          <span className="truncate text-[10px] font-semibold leading-4 tracking-wide">
            {formatToolTagLabel(tag)}
          </span>
        </span>
      ))}
    </div>
  )
}
