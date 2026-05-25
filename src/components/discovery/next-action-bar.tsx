import { ArrowRight, FolderOpenDot } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DisplayPanel } from '@/components/ui/display-shell'
import { getToolById } from '@/shared/tool-registry'
import type { AgentUiPayload } from '@/shared/market-types'
import type { ChatToolPayload } from '@/lib/client/llm'

type NextActionBarProps = {
  payload: AgentUiPayload | null
  selectedToolPayload: ChatToolPayload
  onLaunchCandidate: (toolId: string) => void
  onOpenExternalCandidate: (url: string) => void
  onSaveCandidate: (toolId: string) => void
  onOpenPocket: () => void
}

export function NextActionBar({
  payload,
  selectedToolPayload,
  onLaunchCandidate,
  onOpenExternalCandidate,
  onSaveCandidate,
  onOpenPocket,
}: NextActionBarProps) {
  const leadingCandidate = payload?.candidates[0] ?? null
  const leadingToolId = leadingCandidate?.toolId ?? selectedToolPayload?.toolId ?? null
  const leadingExternalUrl =
    leadingCandidate?.candidateType === 'external_suggestion'
      ? (leadingCandidate.url ?? null)
      : null
  const tool = getToolById(leadingToolId)

  return (
    <DisplayPanel className="flex min-h-[3.25rem] items-center rounded-3xl border-slate-200 bg-white/94 px-3 py-2.5 shadow-lg shadow-slate-900/6 backdrop-blur-xl sm:min-h-[3.5rem]">
      <div className="flex w-full flex-wrap items-center justify-between gap-x-2 gap-y-2">
        <div className="flex min-h-[2.5rem] flex-col justify-center py-0.5">
          <p className="text-[10px] font-bold uppercase leading-none tracking-[0.16em] text-primary">
            下一步
          </p>
          <p className="mt-1 text-sm font-black leading-normal text-foreground">
            {leadingExternalUrl
              ? `先打开 ${leadingCandidate?.title ?? '外部工具'}，有效后再提交到 Tool Hub。`
              : tool
                ? `先打开 ${tool.name}，再决定是否沉淀。`
                : '先输入任务，让 DoraPocket 给出首选工具。'}
          </p>
        </div>
        <div className="flex min-h-[2.5rem] flex-wrap items-center gap-2">
          {leadingExternalUrl ? (
            <Button
              type="button"
              className="h-9 rounded-full px-3.5 text-xs font-bold"
              onClick={() => onOpenExternalCandidate(leadingExternalUrl)}
            >
              打开外部工具
              <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          ) : leadingToolId ? (
            <>
              <Button
                type="button"
                className="h-9 rounded-full px-3.5 text-xs font-bold"
                onClick={() => onLaunchCandidate(leadingToolId)}
              >
                立即执行
                <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-9 rounded-full px-3.5 text-xs font-bold"
                onClick={() => onSaveCandidate(leadingToolId)}
              >
                收入口袋
              </Button>
            </>
          ) : null}
          <Button
            type="button"
            variant="ghost"
            className="h-9 rounded-full px-3.5 text-xs font-bold"
            onClick={onOpenPocket}
          >
            <FolderOpenDot className="mr-1.5 h-3.5 w-3.5" />
            收口袋
          </Button>
        </div>
      </div>
    </DisplayPanel>
  )
}
