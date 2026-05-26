'use client'

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function SettingRow({
  label,
  description,
  children,
  className,
}: {
  label: string
  description?: string
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 rounded-xl border border-border/50 bg-slate-50/80 px-3 py-2.5',
        className,
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-950">{label}</p>
        {description ? (
          <p className="mt-0.5 text-xs leading-snug text-slate-600">{description}</p>
        ) : null}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

type SegmentedOption<T extends string> = {
  value: T
  label: string
}

export function SegmentedSettingControl<T extends string>({
  value,
  options,
  onChange,
  className,
  size = 'default',
}: {
  value: T
  options: readonly SegmentedOption<T>[]
  onChange: (value: T) => void
  className?: string
  size?: 'default' | 'lg'
}) {
  return (
    <div
      className={cn(
        'flex items-stretch rounded-xl border border-border/50 bg-white/60',
        size === 'lg' ? 'p-1' : 'p-0.5',
        className,
      )}
      role="group"
    >
      {options.map((option) => {
        const active = value === option.value
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            className={cn(
              'rounded-full font-semibold leading-none transition-colors duration-200',
              size === 'lg' ? 'min-h-9 px-4 py-2 text-xs sm:text-sm' : 'px-3 py-1.5 text-[11px]',
              active
                ? 'bg-primary text-primary-foreground shadow-[0_6px_16px_rgba(37,99,235,0.18)]'
                : 'text-slate-600 hover:bg-white/90 hover:text-slate-950',
            )}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
