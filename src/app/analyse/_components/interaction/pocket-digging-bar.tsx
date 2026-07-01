import { PackageOpen } from 'lucide-react'
import Image from 'next/image'
import {
  isAnalyzingFlow,
  isRecommendationRevealing,
  resolvePocketBarCopy,
  type AnalysisFlow,
} from '@/shared/analysis-stage-content'
import { cn } from '@/lib/utils'

type PocketDiggingBarProps = {
  analysisFlow: AnalysisFlow
}

export function PocketDiggingBar({ analysisFlow }: PocketDiggingBarProps) {
  if (!isAnalyzingFlow(analysisFlow)) return null

  const copy = resolvePocketBarCopy(analysisFlow)
  const isHandoff = isRecommendationRevealing(analysisFlow)

  return (
    <div
      data-dorapocket-pocket-bar
      data-dorapocket-ui
      className="relative z-10 shrink-0 border-t border-white/60 bg-white/78 p-2.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur-md sm:p-3"
      aria-live="polite"
      aria-busy="true"
    >
      <div
        className={cn(
          'relative flex min-h-11 items-center gap-3 rounded-2xl border border-white/85 bg-white/95 px-4 py-3 shadow-sm backdrop-blur-md',
          isHandoff && 'animate-dp-tab-pop',
        )}
      >
        <span className="relative flex h-12 w-12 shrink-0 items-center justify-center">
          <span className="absolute inset-0 rounded-full bg-sky-100 motion-safe:animate-pulse" />
          <Image
            src="/images/pocket.png"
            alt=""
            width={48}
            height={48}
            className="relative h-11 w-11 object-contain drop-shadow-sm"
          />
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="text-sm font-black text-slate-950">{copy.title}</span>
          <span className="mt-1 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600">
            <PackageOpen className="h-3.5 w-3.5 text-sky-600" />
            {copy.detail}
          </span>
        </span>
      </div>
    </div>
  )
}
