'use client'

import Link from 'next/link'
import { CheckCircle2, ExternalLink, Pin } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DisplayPanel,
  DisplayPanelDescription,
  DisplayPanelHeader,
  DisplayPanelTitle,
} from '@/components/ui/display-shell'
import { PAGE_COPY } from '@/shared/ui-copy'

type PocketToolCardProps = {
  toolId: string
  toolName: string
  toolIcon: string
  toolDescription: string
  tags: string[]
  pinned: boolean
  purchased: boolean
  archived?: boolean
  canOpenExternally: boolean
  onTogglePin?: () => void
  onTogglePurchased?: () => void
  onToggleArchive: () => void
  onRemove: () => void
  onOpenExternal?: () => void
}

export function PocketToolCard({
  toolId,
  toolName,
  toolIcon,
  toolDescription,
  tags,
  pinned,
  purchased,
  archived = false,
  canOpenExternally,
  onTogglePin,
  onTogglePurchased,
  onToggleArchive,
  onRemove,
  onOpenExternal,
}: PocketToolCardProps) {
  return (
    <DisplayPanel
      key={toolId}
      className={`flex ${archived ? 'min-h-48' : 'min-h-56'} flex-col rounded-3xl border-border/60 bg-slate-50 p-4 shadow-none`}
    >
      <div className="flex items-start justify-between gap-3">
        <DisplayPanelHeader className="min-w-0 p-0">
          <DisplayPanelTitle className="text-lg">
            {toolIcon} {toolName}
          </DisplayPanelTitle>
          <DisplayPanelDescription className="mt-2 line-clamp-3 text-xs leading-relaxed">
            {toolDescription}
          </DisplayPanelDescription>
        </DisplayPanelHeader>
        <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
          {pinned && !archived ? (
            <Badge
              className="border-amber-100 bg-amber-100 px-2.5 py-1 text-[10px] font-bold text-amber-800"
              variant="outline"
            >
              {PAGE_COPY.pocket.pinnedBadge}
            </Badge>
          ) : null}
          {purchased ? (
            <Badge
              className="border-emerald-100 bg-emerald-100 px-2.5 py-1 text-[10px] font-bold text-emerald-800"
              variant="outline"
            >
              {PAGE_COPY.pocket.purchasedBadge}
            </Badge>
          ) : null}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {tags.slice(0, archived ? 1 : 4).map((tag) => (
          <Badge
            key={tag}
            variant="outline"
            className="border-white/80 bg-white px-2 py-0.5 text-[10px] font-semibold text-foreground/70"
          >
            {tag}
          </Badge>
        ))}
      </div>
      <div className="mt-auto pt-4">
        <div className="mt-3 flex flex-wrap gap-2">
          {!archived ? (
            <>
              <Button
                type="button"
                variant="outline"
                className="h-9 rounded-full bg-white px-3 text-xs"
                onClick={onTogglePin}
              >
                <Pin className="mr-1.5 h-3.5 w-3.5" />
                {pinned ? PAGE_COPY.pocket.unpinAction : PAGE_COPY.pocket.pinAction}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-9 rounded-full bg-white px-3 text-xs"
                onClick={onTogglePurchased}
              >
                <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                {purchased
                  ? PAGE_COPY.pocket.unmarkPurchasedAction
                  : PAGE_COPY.pocket.markPurchasedAction}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-9 rounded-full bg-white px-3 text-xs"
                onClick={onToggleArchive}
              >
                {PAGE_COPY.pocket.archiveAction}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-9 rounded-full bg-white px-3 text-xs"
                onClick={onRemove}
              >
                {PAGE_COPY.pocket.removeAction}
              </Button>
              {canOpenExternally ? (
                <Button
                  type="button"
                  className="h-9 rounded-full px-3 text-xs"
                  onClick={onOpenExternal}
                >
                  打开
                  <ExternalLink className="ml-1 h-3.5 w-3.5" />
                </Button>
              ) : (
                <Button asChild className="h-9 rounded-full px-3 text-xs">
                  <Link href="/analyse">{PAGE_COPY.pocket.backToAnalysisAction}</Link>
                </Button>
              )}
            </>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                className="h-9 rounded-full bg-white px-3 text-xs"
                onClick={onToggleArchive}
              >
                {PAGE_COPY.pocket.unarchiveAction}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-9 rounded-full bg-white px-3 text-xs"
                onClick={onRemove}
              >
                {PAGE_COPY.pocket.deleteAction}
              </Button>
            </>
          )}
        </div>
      </div>
    </DisplayPanel>
  )
}
