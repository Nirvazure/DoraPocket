import { RotateCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DisplayPanel, DisplayPanelContent } from '@/components/ui/display-shell'
import { getToolById } from '@/services/tool-registry'
import type { AgentUiPayload } from '@/shared/market-types'

type ReuseSignalCardProps = {
  payload: AgentUiPayload | null
  autoSaveNotice: { toolId: string; label: string } | null
  autoSaveEnabled: boolean
  onOpenPocket: () => void
  onUndoAutoSave: () => void
  onEnableAutoSave: () => void
}

export function ReuseSignalCard({
  payload,
  autoSaveNotice,
  autoSaveEnabled,
  onOpenPocket,
  onUndoAutoSave,
  onEnableAutoSave,
}: ReuseSignalCardProps) {
  const leadingCandidate = payload?.candidates[0] ?? null
  const leadingToolId = leadingCandidate?.toolId ?? autoSaveNotice?.toolId ?? null
  const tool = getToolById(leadingToolId)
  const isExternalSuggestion = leadingCandidate?.candidateType === 'external_suggestion'
  const shouldSave = Boolean(!isExternalSuggestion && (payload?.shouldAutoSave || autoSaveNotice))

  return (
    <DisplayPanel className="rounded-3xl border-emerald-200/70 bg-emerald-50/55 p-4 text-emerald-950 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-emerald-700 shadow-sm">
          <RotateCw className="h-4 w-4" />
        </div>
        <DisplayPanelContent className="min-w-0 flex-1 p-0">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">复用信号</p>
          <h3 className="mt-1 text-base font-black">
            {autoSaveNotice
              ? `${autoSaveNotice.label} 已经入口袋`
              : shouldSave
                ? '这轮结果值得沉淀'
                : '只沉淀以后能省事的结果'}
          </h3>
          <p className="mt-1 text-xs leading-relaxed text-emerald-900/78">
            {isExternalSuggestion
              ? '这是 Hub 外建议，先试用；确认有效后再提交 Tool Hub，后续才能进入复用闭环。'
              : tool
                ? `下次遇到类似任务，可以直接从口袋复用 ${tool.name}，不用再重新比较一轮。`
                : '保存不是收藏链接，而是让下一次任务少走一遍选型流程。'}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              className="h-8 rounded-full px-3 text-[11px]"
              onClick={onOpenPocket}
            >
              查看口袋
            </Button>
            {autoSaveNotice ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-8 rounded-full bg-white px-3 text-[11px]"
                onClick={onUndoAutoSave}
              >
                撤销
              </Button>
            ) : null}
            {!autoSaveEnabled ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-8 rounded-full bg-white px-3 text-[11px]"
                onClick={onEnableAutoSave}
              >
                重新开启自动沉淀
              </Button>
            ) : null}
          </div>
        </DisplayPanelContent>
      </div>
    </DisplayPanel>
  )
}
