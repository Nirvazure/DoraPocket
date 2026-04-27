'use client'

import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DisplayPanel,
  DisplayPanelContent,
  DisplayPanelHeader,
  DisplayPanelTitle,
} from '@/components/ui/display-shell'
import { Input } from '@/components/ui/input'

type Draft = {
  name: string
  url: string
  description: string
  tags: string
}

type MarketSubmitModalProps = {
  open: boolean
  draft: Draft
  onClose: () => void
  onDraftChange: (draft: Draft) => void
  onSubmit: () => void
}

export function MarketSubmitModal({
  open,
  draft,
  onClose,
  onDraftChange,
  onSubmit,
}: MarketSubmitModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-sm">
      <DisplayPanel className="w-full max-w-xl rounded-[2rem] bg-white p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <DisplayPanelHeader className="p-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
              My Submission
            </p>
            <DisplayPanelTitle className="mt-1 text-2xl">提交到我的市场投稿</DisplayPanelTitle>
          </DisplayPanelHeader>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="rounded-full text-muted-foreground hover:bg-slate-100 hover:text-foreground"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <DisplayPanelContent className="mt-4 space-y-3 p-0">
          <Input
            value={draft.name}
            onChange={(event) => onDraftChange({ ...draft, name: event.target.value })}
            placeholder="工具名称"
            className="rounded-2xl"
          />
          <Input
            value={draft.url}
            onChange={(event) => onDraftChange({ ...draft, url: event.target.value })}
            placeholder="工具网址"
            className="rounded-2xl"
          />
          <textarea
            value={draft.description}
            onChange={(event) => onDraftChange({ ...draft, description: event.target.value })}
            placeholder="它解决什么问题？为什么值得进入我的 DoraPocket 市场资产？"
            className="min-h-28 w-full rounded-2xl border border-border/70 bg-background px-3 py-2 text-sm outline-none ring-primary/30 focus-visible:ring-2"
          />
          <Input
            value={draft.tags}
            onChange={(event) => onDraftChange({ ...draft, tags: event.target.value })}
            placeholder="标签，使用逗号分隔"
            className="rounded-2xl"
          />
        </DisplayPanelContent>
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-10 rounded-full px-4"
            onClick={onClose}
          >
            取消
          </Button>
          <Button type="button" className="h-10 rounded-full px-4" onClick={onSubmit}>
            提交到我的投稿库
          </Button>
        </div>
      </DisplayPanel>
    </div>
  )
}
