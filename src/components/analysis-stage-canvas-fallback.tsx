import { AlertTriangle, RefreshCw, Sparkles } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type AnalysisStageCanvasFallbackVariant = 'loading' | 'idle' | 'unavailable'

type AnalysisStageCanvasFallbackProps = {
  variant?: AnalysisStageCanvasFallbackVariant
}

export function AnalysisStageCanvasFallback({
  variant = 'loading',
}: AnalysisStageCanvasFallbackProps) {
  const isLoading = variant === 'loading'
  const isUnavailable = variant === 'unavailable'

  return (
    <div
      className={cn(
        'absolute inset-0 flex flex-col items-center justify-center px-4',
        variant === 'idle' ? 'z-0' : 'z-[2]',
        isUnavailable
          ? 'bg-gradient-to-b from-amber-50/85 via-white/50 to-white/75'
          : 'bg-gradient-to-b from-sky-50/80 via-white/40 to-white/70',
      )}
      aria-hidden={variant === 'idle' ? true : undefined}
      aria-busy={isLoading ? true : undefined}
      aria-live={isUnavailable ? 'polite' : undefined}
      aria-label={isLoading ? '舞台加载中' : isUnavailable ? '3D 舞台暂不可用' : undefined}
      role={isLoading ? 'status' : isUnavailable ? 'alert' : undefined}
    >
      <div
        className={cn(
          'relative flex items-center justify-center',
          isUnavailable
            ? 'h-auto w-full max-w-[14rem] flex-col gap-3'
            : 'h-[5.5rem] w-[5.5rem] sm:h-[6.25rem] sm:w-[6.25rem]',
        )}
      >
        {isLoading ? (
          <>
            <span className="absolute inset-0 rounded-full border border-sky-200/35 motion-safe:animate-[spin_14s_linear_infinite]" />
            <span className="absolute inset-2 rounded-full border border-dashed border-sky-300/45 motion-safe:animate-[spin_18s_linear_infinite_reverse]" />
            <span className="absolute inset-4 rounded-full bg-sky-100/55 motion-safe:animate-pulse" />
          </>
        ) : isUnavailable ? null : (
          <span className="absolute inset-3 rounded-full bg-sky-100/45" />
        )}

        {isUnavailable ? (
          <>
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-white/95 to-amber-50/90 shadow-sm shadow-amber-200/35 ring-1 ring-amber-100/90 sm:h-14 sm:w-14">
              <AlertTriangle
                className="h-6 w-6 text-amber-600 sm:h-7 sm:w-7"
                strokeWidth={1.75}
                aria-hidden
              />
            </span>
            <div className="text-center">
              <p className="text-sm font-semibold text-foreground/88">3D 舞台暂不可用</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                图形渲染异常，分析功能不受影响
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 rounded-full border-amber-200/80 bg-white/95 px-3 text-xs text-amber-900 hover:bg-amber-50"
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" aria-hidden />
              刷新页面
            </Button>
          </>
        ) : (
          <span
            className={cn(
              'relative flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-white/95 to-sky-50/90 shadow-sm shadow-sky-200/30 ring-1 ring-sky-100/80 sm:h-14 sm:w-14',
              isLoading && 'motion-safe:animate-pulse',
            )}
          >
            <Sparkles
              className={cn(
                'h-6 w-6 text-sky-500 sm:h-7 sm:w-7',
                isLoading ? 'opacity-90' : 'opacity-75',
              )}
              strokeWidth={1.75}
              aria-hidden
            />
          </span>
        )}
      </div>

      {isLoading ? (
        <p className="mt-4 text-xs font-medium text-sky-600/90 motion-safe:animate-pulse">
          舞台加载中…
        </p>
      ) : null}
    </div>
  )
}
