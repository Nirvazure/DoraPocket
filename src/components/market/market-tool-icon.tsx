'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import type { ToolItem } from '@/shared/tool-registry'

type MarketToolIconProps = {
  tool: ToolItem
  size?: 'sm' | 'md'
}

export function MarketToolIcon({ tool, size = 'md' }: MarketToolIconProps) {
  const [imageFailed, setImageFailed] = useState(false)
  const imageSrc = useMemo(() => {
    if (imageFailed) return null
    return tool.iconImageLocalPath ?? tool.iconImageUrl ?? null
  }, [imageFailed, tool.iconImageLocalPath, tool.iconImageUrl])

  const boxClassName =
    size === 'sm' ? 'h-10 w-10 rounded-2xl text-lg' : 'h-12 w-12 rounded-2xl text-xl'

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
          width={48}
          height={48}
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
