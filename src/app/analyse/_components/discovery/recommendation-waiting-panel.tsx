import Image from 'next/image'
import { Clock3, Compass, Languages, PackageOpen, Search, Sparkles, Wand2 } from 'lucide-react'
import {
  resolvePocketBarCopy,
  type AnalysisFlow,
} from '@/app/analyse/_domain/analysis-stage-content'

const pocketLines = [
  '口袋里有很多选择，Dora 正在替你筛掉不合适的。',
  '先别急着拿出来，这次要找的是最顺手的那个。',
  '快摸到了，正在确认它是不是适合这次任务。',
]

const inspectionRails = [
  [
    { label: '省时间', Icon: Clock3 },
    { label: '少折腾', Icon: Wand2 },
    { label: '中文友好', Icon: Languages },
    { label: '马上能用', Icon: Sparkles },
  ],
  [
    { label: '更顺手', Icon: Sparkles },
    { label: '能落地', Icon: Compass },
    { label: '少配置', Icon: PackageOpen },
    { label: '结果稳', Icon: Search },
  ],
]

type RecommendationWaitingPanelProps = {
  analysisFlow: AnalysisFlow
}

export function RecommendationWaitingPanel({ analysisFlow }: RecommendationWaitingPanelProps) {
  const copy = resolvePocketBarCopy(analysisFlow)

  return (
    <section className="relative flex min-h-[clamp(28rem,64vh,46rem)] flex-1 overflow-hidden rounded-[1.35rem] border border-primary/15 bg-white p-4 shadow-xl shadow-primary/5 sm:p-6">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_78%_18%,rgba(14,165,233,0.20),transparent_32%),radial-gradient(circle_at_20%_74%,rgba(125,211,252,0.18),transparent_30%),linear-gradient(135deg,rgba(255,255,255,0.98),rgba(240,249,255,0.78))]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute right-[-7rem] top-[-7rem] h-72 w-72 rounded-full border border-sky-200/70"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute bottom-[-10rem] left-[-7rem] h-80 w-80 rounded-full border border-sky-100"
        aria-hidden
      />

      <div className="relative z-10 grid min-h-full w-full grid-rows-[auto_1fr_auto] gap-8">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-3xl font-black tracking-normal text-foreground sm:text-4xl">
              正在翻找最合适的道具
            </p>
            <p className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground sm:text-base">
              <PackageOpen className="h-4 w-4 text-sky-600" />
              {copy.title} · {copy.detail}
            </p>
          </div>
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 motion-safe:animate-pulse">
            <Search className="h-5 w-5" />
          </span>
        </div>

        <div className="relative flex min-h-0 items-center justify-center overflow-hidden py-2">
          <span className="absolute left-[24%] top-[26%] hidden h-2 w-2 rounded-full bg-primary/50 shadow-[0_0_18px_hsl(var(--primary)/0.55)] motion-safe:animate-dp-pocket-spark md:block" />
          <span className="absolute bottom-[30%] right-[26%] hidden h-2.5 w-2.5 rounded-full bg-sky-300/70 shadow-[0_0_18px_rgba(125,211,252,0.75)] motion-safe:animate-dp-pocket-spark md:block" />

          <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-[32%] overflow-hidden sm:block">
            <div className="animate-dp-pocket-conveyor space-y-3 py-3">
              {[...inspectionRails[0], ...inspectionRails[0]].map(({ label, Icon }, index) => (
                <span
                  key={`${label}-${index}`}
                  className="ml-2 flex w-fit items-center gap-2 rounded-full border border-white/80 bg-white/85 px-3 py-2 text-xs font-bold text-sky-700 shadow-lg shadow-sky-100/70 backdrop-blur-sm"
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </span>
              ))}
            </div>
          </div>

          <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[32%] overflow-hidden sm:block">
            <div className="animate-dp-pocket-conveyor-reverse space-y-3 py-3">
              {[...inspectionRails[1], ...inspectionRails[1]].map(({ label, Icon }, index) => (
                <span
                  key={`${label}-${index}`}
                  className="ml-auto mr-2 flex w-fit items-center gap-2 rounded-full border border-white/80 bg-white/85 px-3 py-2 text-xs font-bold text-sky-700 shadow-lg shadow-sky-100/70 backdrop-blur-sm"
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </span>
              ))}
            </div>
          </div>

          <div className="relative flex aspect-square w-[min(54vw,22rem)] items-center justify-center">
            <span className="absolute h-full w-full rounded-full bg-sky-100/70 motion-safe:animate-dp-pocket-breathe" />
            <span className="absolute h-[86%] w-[86%] rounded-full border border-sky-200/80 motion-safe:animate-[spin_18s_linear_infinite]" />
            <span className="absolute h-[72%] w-[72%] rounded-full border border-dashed border-sky-200/80 motion-safe:animate-[spin_24s_linear_infinite_reverse]" />
            <span className="absolute h-[58%] w-[58%] rounded-full bg-white/80 shadow-2xl shadow-sky-200/70" />
            <Image
              src="/images/pocket.png"
              alt=""
              width={180}
              height={180}
              className="relative h-[42%] w-[42%] object-contain drop-shadow-xl motion-safe:animate-dp-pocket-float"
              priority
            />
            <span className="absolute right-[18%] top-[20%] flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-sky-600 shadow-lg shadow-sky-200/70 motion-safe:animate-dp-pocket-drift">
              <Sparkles className="h-5 w-5" />
            </span>
            <span className="absolute bottom-[18%] left-[17%] flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-sky-600 shadow-lg shadow-sky-200/70 motion-safe:animate-dp-pocket-drift-slow">
              <Wand2 className="h-5 w-5" />
            </span>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[1.15rem] border border-white/80 bg-white/75 px-4 py-3 shadow-sm backdrop-blur-sm">
          <div className="flex items-center gap-2 text-xs font-black text-sky-700">
            <Compass className="h-4 w-4" />
            正在把候选道具排成更靠谱的顺序
          </div>
          <div className="mt-3 h-7 overflow-hidden text-sm font-semibold text-slate-600">
            <div className="animate-dp-pocket-line-roll space-y-2">
              {[...pocketLines, pocketLines[0]].map((line, index) => (
                <p key={`${line}-${index}`} className="h-7 leading-7">
                  {line}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
