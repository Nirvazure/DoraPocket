import { useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const FEEDBACK_OPTIONS = ['解决了', '没解决', '太复杂', '太贵', '想换一个']

export function ResultFeedbackCard() {
  const [selectedFeedback, setSelectedFeedback] = useState<string | null>(null)

  return (
    <article className="rounded-3xl border border-border/60 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">结果反馈</p>
          <h3 className="mt-1 text-lg font-black text-foreground">这次解决了吗？</h3>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            轻点一下就好，这会成为下次排序和推荐解释的参考信号。
          </p>
        </div>
        {selectedFeedback ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-700">
            <CheckCircle2 className="h-3.5 w-3.5" />
            已记录
          </span>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {FEEDBACK_OPTIONS.map((option) => {
          const selected = selectedFeedback === option
          return (
            <button
              key={option}
              type="button"
              className={cn(
                'rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
                selected
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border/70 bg-slate-50 text-foreground/78 hover:border-primary/25 hover:bg-primary/[0.05]',
              )}
              onClick={() => setSelectedFeedback(option)}
            >
              {option}
            </button>
          )
        })}
      </div>

      {selectedFeedback ? (
        <p className="mt-3 rounded-2xl border border-primary/15 bg-primary/[0.04] px-3 py-2 text-xs font-semibold text-foreground/75">
          已记录：{selectedFeedback}。下次会参考这个反馈。
        </p>
      ) : null}
    </article>
  )
}
