'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import type { ToolItem } from '@/shared/tool-registry'

type MarketToolIconProps = {
  tool: ToolItem
  size?: 'sm' | 'md' | 'lg'
}

export function MarketToolIcon({ tool, size = 'md' }: MarketToolIconProps) {
  const [imageFailed, setImageFailed] = useState(false)
  const imageSrc = useMemo(() => {
    if (imageFailed) return null
    return tool.iconImageUrl ?? null
  }, [imageFailed, tool.iconImageUrl])

  const boxClassName =
    size === 'sm'
      ? 'h-10 w-10 rounded-2xl text-lg'
      : size === 'lg'
        ? 'h-16 w-16 rounded-[1.25rem] text-2xl'
        : 'h-12 w-12 rounded-2xl text-xl'

  const imageSize = size === 'lg' ? 64 : size === 'sm' ? 40 : 48

  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center overflow-hidden border border-border/60 bg-white shadow-sm',
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
