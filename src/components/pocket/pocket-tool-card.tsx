'use client'

import Image from 'next/image'
import { ExternalLink, HeartOff } from 'lucide-react'
import { MarketCategoryIcon } from '@/components/market/market-category-icons'
import { Button, buttonVariants } from '@/components/ui/button'
import { DisplayPanel, DisplayPanelContent } from '@/components/ui/display-shell'
import { cn } from '@/lib/utils'
import type { PocketInventoryItem } from '@/shared/pocket-types'
import type { ToolItem } from '@/shared/tool-registry'
import { getPocketCategoryLabel } from '@/components/pocket/pocket-utils'

type PocketToolCardProps = {
  item: PocketInventoryItem
  tool: ToolItem
  onOpen: (toolId: string) => void
  onRemove: (toolId: string) => void
}

function formatSavedAt(value: number) {
  return new Date(value).toLocaleDateString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
  })
}

export function PocketToolCard({ item, tool, onOpen, onRemove }: PocketToolCardProps) {
  const href = tool.url ?? '/analyse'

  return (
    <DisplayPanel className="overflow-hidden rounded-[1.7rem] border-white/90 bg-white shadow-[0_16px_42px_rgba(15,23,42,0.07)]">
      <DisplayPanelContent className="space-y-4 p-5">
        <div className="flex items-start gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-[1.2rem] border border-slate-200 bg-slate-50">
            {tool.iconImageUrl ? (
              <Image
                src={tool.iconImageUrl}
                alt=""
                width={56}
                height={56}
                unoptimized
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-950 text-white">
                <MarketCategoryIcon category={tool.category} className="h-4 w-4" />
              </span>
            )}
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-lg font-black text-slate-950">{tool.name}</p>
                <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-600">
                  {tool.description}
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">
                {getPocketCategoryLabel(tool.category)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 text-xs text-slate-500">
          <span>收藏于 {formatSavedAt(item.savedAt)}</span>
          <span>{tool.requiresAuth ? '需要登录' : '可直接使用'}</span>
        </div>

        <div className="flex flex-wrap gap-2">
          <a
            href={href}
            target={href.startsWith('http') ? '_blank' : undefined}
            rel={href.startsWith('http') ? 'noreferrer' : undefined}
            className={cn(
              buttonVariants({ variant: 'default' }),
              'h-10 rounded-full px-4 text-sm font-bold',
            )}
            onClick={() => onOpen(item.toolId)}
          >
            <ExternalLink className="h-4 w-4" />
            打开工具
          </a>
          <Button
            type="button"
            variant="outline"
            className="h-10 rounded-full px-4 text-sm font-bold text-slate-700"
            onClick={() => onRemove(item.toolId)}
          >
            <HeartOff className="h-4 w-4" />
            取消收藏
          </Button>
        </div>
      </DisplayPanelContent>
    </DisplayPanel>
  )
}
