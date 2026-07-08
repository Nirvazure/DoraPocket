'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import type { ToolItem } from '@/shared/market/tool-registry'

type MarketToolIconProps = {
  tool: ToolItem
  size?: 'sm' | 'md' | 'lg' | 'card' | 'hero' | 'watermark'
  tone?: 'default' | 'on-dark' | 'watermark'
}

export function MarketToolIcon({ tool, size = 'md', tone = 'default' }: MarketToolIconProps) {
  const [imageFailed, setImageFailed] = useState(false)
  const imageSrc = useMemo(() => {
    if (imageFailed) return null
    return tool.iconImageUrl ?? null
  }, [imageFailed, tool.iconImageUrl])

  const boxClassName =
    size === 'sm'
      ? 'h-10 w-10 rounded-2xl text-lg'
      : size === 'card'
        ? 'dp-tool-icon-tile h-14 w-14 text-xl'
        : size === 'watermark'
          ? 'h-48 w-48 rounded-[2.25rem] text-5xl sm:h-56 sm:w-56 sm:rounded-[2.5rem] sm:text-6xl'
          : size === 'hero'
            ? 'h-20 w-20 rounded-[1.35rem] text-3xl sm:h-24 sm:w-24 sm:rounded-[1.5rem] sm:text-4xl'
            : size === 'lg'
              ? 'h-16 w-16 rounded-[1.25rem] text-2xl'
              : 'h-12 w-12 rounded-2xl text-xl'

  const imageSize =
    size === 'watermark'
      ? 224
      : size === 'hero'
        ? 96
        : size === 'lg'
          ? 64
          : size === 'card'
            ? 56
            : size === 'sm'
              ? 40
              : 48
  const isOnDark = tone === 'on-dark'
  const isWatermark = tone === 'watermark'

  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center overflow-hidden',
        size !== 'card' &&
          (isWatermark
            ? 'border-0 bg-transparent shadow-none'
            : isOnDark
              ? 'border border-white/12 bg-white/10 shadow-none backdrop-blur-sm'
              : 'border border-border/60 bg-white shadow-sm'),
        boxClassName,
      )}
    >
      {tool.iconType === 'favicon' && imageSrc ? (
        <Image
          src={imageSrc}
          alt={`${tool.name} icon`}
          width={imageSize}
          height={imageSize}
          unoptimized
          className="h-full w-full object-cover"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <span aria-hidden="true">{tool.iconText ?? tool.icon ?? '🌐'}</span>
      )}
    </div>
  )
}
