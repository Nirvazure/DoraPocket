'use client'

import { useState, type ReactNode } from 'react'
import { Aperture, Compass, Orbit, Radar, Settings2, Sparkles, Waves } from 'lucide-react'
import { cn } from '@/lib/utils'

type CalibrationState = 'closer' | 'not_me' | null

type PersonaSignal = {
  id: string
  label: string
  value: string
  detail: string
  drift: string
}

const PERSONA_SIGNALS: PersonaSignal[] = [
  {
    id: 'clarity',
    label: '表达偏好',
    value: '先结论，再补理由',
    detail: '面对新任务时，你更希望先拿到一个可执行方向，再决定要不要继续展开上下文。',
    drift: '胶囊把这类判断记成了“先定方向，再拉近细节”。',
  },
  {
    id: 'friction',
    label: '使用倾向',
    value: '低摩擦、快上手',
    detail: '如果一件工具不能在很短时间里进入工作状态，你对它的耐心会明显下降。',
    drift: '它会优先保留那些几乎不用学习成本的选择方式。',
  },
  {
    id: 'texture',
    label: '体验气质',
    value: '中文友好、实用优先',
    detail: '比起花哨表达，你更容易被语义清楚、结构扎实、贴近中文工作场景的体验说服。',
    drift: '这枚胶囊正在把“可信”和“顺手”放在更靠前的位置。',
  },
]

const CALIBRATION_COPY = {
  closer: '这枚胶囊已经更贴近你现在的节奏。Dora 会更坚定地沿着这个方向理解你。',
  not_me: '这段理解被放轻了一些。Dora 会给新的信号留出更多空间，而不是过早下结论。',
} as const

const SUMMARY_COPY = ['偏安静，不抢答。', '偏凝练，不铺陈。', '偏实用，不表演。'] as const

export function ProfilePersonaDemo() {
  const [expanded, setExpanded] = useState(false)
  const [focusedSignalId, setFocusedSignalId] = useState<string>(PERSONA_SIGNALS[0].id)
  const [calibrationState, setCalibrationState] = useState<CalibrationState>(null)

  const focusedSignal =
    PERSONA_SIGNALS.find((signal) => signal.id === focusedSignalId) ?? PERSONA_SIGNALS[0]

  return (
    <section className="relative overflow-visible rounded-[2rem] border border-white/75 bg-[linear-gradient(180deg,rgba(255,255,255,0.86)_0%,rgba(240,246,255,0.82)_42%,rgba(231,239,249,0.88)_100%)] px-4 py-4 shadow-[0_28px_90px_-56px_rgba(19,59,123,0.28)] backdrop-blur-2xl sm:px-5 sm:py-5 lg:px-6 lg:py-6">
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
        <div className="absolute left-[12%] top-0 h-32 w-52 rounded-full bg-[radial-gradient(circle,rgba(142,198,255,0.16),transparent_72%)] blur-3xl" />
        <div className="absolute bottom-[-3rem] right-[10%] h-44 w-44 rounded-full bg-[radial-gradient(circle,rgba(255,177,150,0.11),transparent_72%)] blur-3xl" />
        <div className="absolute left-[45%] top-[12%] h-[72%] w-px bg-[linear-gradient(180deg,rgba(255,255,255,0.85),rgba(255,255,255,0.04))] opacity-70 lg:block hidden" />
      </div>

      <div className="relative z-10 grid gap-5 lg:grid-cols-[17rem_minmax(0,1fr)] lg:gap-6">
        <aside className="space-y-4 lg:sticky lg:top-5 lg:self-start">
          <div className="rounded-[1.85rem] border border-white/78 bg-white/56 px-4 py-4 shadow-[0_18px_46px_-34px_rgba(15,23,42,0.22)] backdrop-blur-xl sm:px-5 sm:py-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-sky-700/75">
                  记忆胶囊
                </p>
                <p className="mt-2 text-[15px] font-semibold leading-6 text-slate-900">
                  一枚被温柔封存的理解切片。
                </p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full border border-white/80 bg-white/72 px-2 py-1 text-[10px] font-semibold text-slate-500">
                <Sparkles className="h-3.5 w-3.5 text-sky-600" />
                沉淀中
              </span>
            </div>

            <button
              type="button"
              onClick={() => setExpanded((value) => !value)}
              className="mt-5 flex w-full justify-center rounded-[1.85rem] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.72)_0%,rgba(235,244,255,0.62)_56%,rgba(217,229,246,0.82)_100%)] px-3 py-5 shadow-[0_24px_60px_-36px_rgba(86,119,170,0.3)] backdrop-blur-2xl transition-transform duration-300 hover:scale-[1.01] sm:py-6"
            >
              <MemoryCapsuleArtwork expanded={expanded} />
            </button>

            <div className="mt-5 space-y-2">
              {SUMMARY_COPY.map((line) => (
                <div
                  key={line}
                  className="rounded-full border border-white/70 bg-white/62 px-3 py-2 text-[12px] font-medium text-slate-600"
                >
                  {line}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[1.6rem] border border-white/72 bg-white/52 p-4 shadow-[0_18px_46px_-38px_rgba(15,23,42,0.2)] backdrop-blur-xl">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">
              <Settings2 className="h-3.5 w-3.5 text-sky-600" />
              轻调校
            </div>
            <p className="mt-3 text-[13px] leading-6 text-slate-600">
              让这枚胶囊更贴近你当下的工作状态。
            </p>

            <div className="mt-4 grid gap-2">
              <CalibrationButton
                active={calibrationState === 'closer'}
                icon={<Waves className="h-4 w-4" />}
                label="更像我"
                onClick={() => setCalibrationState('closer')}
              />
              <CalibrationButton
                active={calibrationState === 'not_me'}
                icon={<Aperture className="h-4 w-4" />}
                label="不太像我"
                onClick={() => setCalibrationState('not_me')}
              />
            </div>

            <div className="mt-4 rounded-[1.25rem] border border-white/72 bg-white/74 px-3.5 py-3 text-[13px] leading-6 text-slate-600">
              {calibrationState
                ? CALIBRATION_COPY[calibrationState]
                : '这里只做很轻的修正，不急着把你定型。Dora 应该更像陪你一起慢慢校准。'}
            </div>
          </div>
        </aside>

        <div className="space-y-5">
          <article className="rounded-[1.95rem] border border-white/78 bg-white/62 p-5 shadow-[0_22px_60px_-42px_rgba(15,23,42,0.22)] backdrop-blur-2xl sm:p-6">
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_16rem] xl:items-start">
              <div>
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">
                  <Radar className="h-3.5 w-3.5 text-sky-600" />
                  当前理解
                </div>
                <p className="mt-4 max-w-2xl text-[1.2rem] font-semibold leading-[1.35] text-slate-950 sm:text-[1.35rem]">
                  {focusedSignal.value}
                </p>
                <p className="mt-3 max-w-2xl text-[14px] leading-7 text-slate-600">
                  {focusedSignal.detail}
                </p>
              </div>

              <div className="rounded-[1.5rem] border border-white/72 bg-[linear-gradient(180deg,rgba(255,255,255,0.76)_0%,rgba(239,244,252,0.66)_100%)] px-4 py-4 backdrop-blur-xl">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">
                  <Compass className="h-3.5 w-3.5 text-sky-600" />
                  读取片段
                </div>
                <p className="mt-3 text-[14px] leading-7 text-slate-600">{focusedSignal.drift}</p>
              </div>
            </div>

            <div className="mt-6 border-t border-white/70 pt-4">
              <div className="space-y-3">
                {PERSONA_SIGNALS.map((signal, index) => {
                  const active = signal.id === focusedSignalId
                  return (
                    <button
                      key={signal.id}
                      type="button"
                      onMouseEnter={() => setFocusedSignalId(signal.id)}
                      onFocus={() => setFocusedSignalId(signal.id)}
                      onClick={() => setFocusedSignalId(signal.id)}
                      className={cn(
                        'grid w-full gap-3 rounded-[1.3rem] border px-4 py-4 text-left transition-all duration-200 sm:grid-cols-[7rem_minmax(0,1fr)_auto] sm:items-center',
                        active
                          ? 'border-sky-200 bg-sky-50/58 shadow-[0_14px_32px_-26px_rgba(56,132,255,0.42)]'
                          : 'border-white/68 bg-white/56 hover:border-white/88 hover:bg-white/78',
                      )}
                    >
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                        0{index + 1}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
                          {signal.label}
                        </span>
                        <span className="mt-1 block text-[15px] font-semibold text-slate-900">
                          {signal.value}
                        </span>
                      </span>
                      <Orbit
                        className={cn('h-4 w-4 shrink-0 text-slate-400', active && 'text-sky-600')}
                      />
                    </button>
                  )
                })}
              </div>
            </div>
          </article>

          <article className="rounded-[1.75rem] border border-white/72 bg-white/54 p-5 shadow-[0_20px_54px_-42px_rgba(15,23,42,0.18)] backdrop-blur-xl sm:p-6">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">
              <Sparkles className="h-3.5 w-3.5 text-sky-600" />
              胶囊说明
            </div>
            <div className="mt-3 grid gap-4 lg:grid-cols-[minmax(0,1fr)_12rem] lg:items-start">
              <p className="text-[14px] leading-7 text-slate-600">
                这里不是一份行为记录，也不是一组静态标签。它更像一小段持续被保留下来的理解方式，安静地影响
                Dora 之后怎么理解你、怎么替你先做第一步判断。
              </p>
              <div className="rounded-[1.35rem] border border-white/72 bg-white/68 px-4 py-4">
                <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                  焦点状态
                </div>
                <div className="mt-3 space-y-2">
                  {PERSONA_SIGNALS.map((signal) => {
                    const active = signal.id === focusedSignalId
                    return (
                      <div key={signal.id} className="flex items-center gap-2">
                        <span
                          className={cn(
                            'h-2 w-2 rounded-full transition-colors duration-200',
                            active ? 'bg-sky-500' : 'bg-slate-300',
                          )}
                        />
                        <span className="text-[12px] font-medium text-slate-500">
                          {signal.label}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>
  )
}

function MemoryCapsuleArtwork({ expanded }: { expanded: boolean }) {
  return (
    <div className="relative flex h-44 w-44 items-center justify-center sm:h-48 sm:w-48">
      <div className="absolute inset-0 rounded-full border border-white/60 bg-[radial-gradient(circle_at_32%_26%,rgba(255,255,255,0.96),rgba(215,228,245,0.44)_46%,rgba(193,208,233,0.2)_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_24px_48px_-28px_rgba(88,117,163,0.4)] backdrop-blur-2xl" />
      <div
        className={cn(
          'absolute inset-[15%] rounded-full border border-white/52 transition-all duration-500',
          expanded
            ? 'scale-100 bg-[radial-gradient(circle,rgba(255,255,255,0.9),rgba(170,209,255,0.24)_65%,transparent_100%)]'
            : 'scale-[0.9] bg-[radial-gradient(circle,rgba(255,255,255,0.82),rgba(170,209,255,0.16)_70%,transparent_100%)]',
        )}
      />
      <div className="absolute inset-x-[26%] top-[22%] h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.95),transparent)]" />
      <div className="absolute inset-x-[30%] bottom-[24%] h-px bg-[linear-gradient(90deg,transparent,rgba(255,166,132,0.52),transparent)]" />
      <div className="relative z-10 flex flex-col items-center text-slate-700">
        <Orbit className="h-9 w-9 text-sky-700/80" />
        <span className="mt-3 text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">
          理解切片
        </span>
      </div>
    </div>
  )
}

function CalibrationButton({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean
  icon: ReactNode
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center justify-center gap-2 rounded-[1.2rem] border px-3 py-3 text-[13px] font-medium transition-all duration-200',
        active
          ? 'border-sky-200 bg-sky-50 text-slate-900 shadow-[0_12px_28px_-24px_rgba(56,132,255,0.45)]'
          : 'border-white/68 bg-white/68 text-slate-500 hover:border-white/90 hover:bg-white/82 hover:text-slate-900',
      )}
    >
      {icon}
      {label}
    </button>
  )
}
