import { cn } from '@/lib/utils'

type DecisionProgressStepsProps = {
  currentStep: number
  maxVisibleStep: number
  expandedStep: number
  onStepClick: (step: number) => void
}

const STEPS = [
  { step: 1, title: '从哪里开始' },
  { step: 2, title: '分析过程' },
  { step: 3, title: '推荐结果和反馈' },
] as const

export function DecisionProgressSteps({
  currentStep,
  maxVisibleStep,
  expandedStep,
  onStepClick,
}: DecisionProgressStepsProps) {
  return (
    <section className="rounded-[0.95rem] border border-white/75 bg-white/55 p-1 backdrop-blur-xl">
      <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-3">
        {STEPS.map((item) => {
          const active = item.step === currentStep
          const done = item.step < currentStep
          const visible = item.step <= maxVisibleStep
          const expanded = item.step === expandedStep

          return (
            <button
              key={item.step}
              type="button"
              disabled={!visible}
              className={cn(
                'flex items-center gap-1.5 rounded-full border px-2 py-1.5 text-left transition-colors',
                active
                  ? 'border-primary/25 bg-primary text-primary-foreground shadow-sm ring-1 ring-primary/15'
                  : done
                    ? 'border-primary/15 bg-primary/[0.06] text-primary'
                    : visible
                      ? 'border-border/60 bg-white/70 text-muted-foreground hover:border-primary/20 hover:bg-primary/[0.04]'
                      : 'cursor-default border-border/40 bg-white/45 text-muted-foreground/60 opacity-70',
                expanded && visible && !active ? 'border-primary/20 bg-primary/[0.05]' : '',
              )}
              onClick={() => onStepClick(item.step)}
            >
              <span
                className={cn(
                  'flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-black',
                  active
                    ? 'bg-white text-primary'
                    : done
                      ? 'bg-primary text-primary-foreground'
                      : visible
                        ? 'bg-slate-100 text-muted-foreground'
                        : 'bg-slate-100/80 text-muted-foreground/75',
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
