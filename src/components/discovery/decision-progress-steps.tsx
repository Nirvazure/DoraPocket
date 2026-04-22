import { cn } from '@/lib/utils'

type DecisionProgressStepsProps = {
  currentStep: number
  onStepClick: (step: number) => void
}

const STEPS = [
  { step: 1, title: '说清处境', description: '先把卡点、场景和限制说清楚。' },
  { step: 2, title: '分析意图', description: '确认任务目标、缺失信息和限制。' },
  { step: 3, title: '推荐与行动', description: '主推荐、备选、打开、沉淀和反馈都在这里完成。' },
]

export function DecisionProgressSteps({ currentStep, onStepClick }: DecisionProgressStepsProps) {
  return (
    <section className="rounded-[0.95rem] border border-white/75 bg-white/55 p-1 backdrop-blur-xl">
      <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-3">
        {STEPS.map((item) => {
          const active = item.step === currentStep
          const done = item.step < currentStep
          return (
            <button
              key={item.step}
              type="button"
              className={cn(
                'flex items-center gap-1.5 rounded-full border px-2 py-1.5 text-left transition-colors',
                active
                  ? 'border-primary/25 bg-primary text-primary-foreground shadow-sm'
                  : done
                    ? 'border-primary/15 bg-primary/[0.06] text-primary'
                    : 'border-border/60 bg-white/70 text-muted-foreground hover:border-primary/20 hover:bg-primary/[0.04]',
              )}
              onClick={() => onStepClick(item.step)}
            >
              <span
                className={cn(
                  'flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-black',
                  active ? 'bg-white text-primary' : done ? 'bg-primary text-primary-foreground' : 'bg-slate-100 text-muted-foreground',
                )}
              >
                {item.step}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[11px] font-black">{item.title}</span>
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
