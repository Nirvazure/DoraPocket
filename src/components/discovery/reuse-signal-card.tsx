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
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">口袋信号</p>
          <h3 className="mt-1 text-base font-black">
            {autoSaveNotice
              ? `${autoSaveNotice.label} 已经收进口袋`
              : shouldSave
                ? '这次结果值得收进口袋'
                : '只保留以后能省事的结果'}
          </h3>
          <p className="mt-1 text-xs leading-relaxed text-emerald-900/78">
            {isExternalSuggestion
              ? '这是 Hub 外建议，先试用；确认有效后再提交到道具库，之后系统才更容易在类似任务里再次选中它。'
              : tool
                ? `下次遇到类似任务，可以直接从我的口袋打开 ${tool.name}，不用再从头比一轮。`
                : '收进口袋不是为了堆收藏，而是为了让下一次出手更快。'}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              className="h-8 rounded-full px-3 text-[11px]"
              onClick={onOpenPocket}
            >
              查看我的口袋
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
                重新开启自动收进口袋
              </Button>
            ) : null}
          </div>
        </DisplayPanelContent>
      </div>
    </DisplayPanel>
  )
}
