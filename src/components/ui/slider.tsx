'use client'

import { Slider as SliderPrimitive } from '@base-ui/react/slider'
import * as React from 'react'

import { cn } from '@/lib/utils'

type SliderProps = React.ComponentProps<typeof SliderPrimitive.Root> & {
  thumbClassName?: string
  getAriaLabel?: (index: number) => string
  getAriaValueText?: (formattedValue: string, value: number, index: number) => string
}

function Slider({
  className,
  thumbClassName,
  getAriaLabel,
  getAriaValueText,
  ...props
}: SliderProps) {
  return (
    <SliderPrimitive.Root
      data-slot="slider"
      className={cn('relative flex w-full touch-none items-center select-none', className)}
      {...props}
    >
      <SliderPrimitive.Control className="flex w-full items-center">
        <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-primary/15">
          <SliderPrimitive.Indicator className="absolute h-full bg-primary" />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb
          getAriaLabel={getAriaLabel}
          getAriaValueText={getAriaValueText}
          className={cn(
            'block size-4 shrink-0 rounded-full border-2 border-primary bg-background shadow-sm outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-50',
            thumbClassName,
          )}
        />
      </SliderPrimitive.Control>
    </SliderPrimitive.Root>
  )
}

export { Slider }
