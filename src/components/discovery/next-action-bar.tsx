import { ArrowRight, FolderOpenDot } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DisplayPanel, DisplayPanelContent } from '@/components/ui/display-shell'
import { getToolById } from '@/services/tool-registry'
import type { AgentUiPayload } from '@/shared/market-types'
import type { ChatToolPayload } from '@/services/llm'

type NextActionBarProps = {
  payload: AgentUiPayload | null
  selectedToolPayload: ChatToolPayload
  onLaunchCandidate: (toolId: string) => void
  onSaveCandidate: (toolId: string) => void
  onOpenPocket: () => void
}

export function NextActionBar({ payload, selectedToolPayload, onLaunchCandidate, onSaveCandidate, onOpenPocket }: NextActionBarProps) {
  const leadingToolId = payload?.candidates[0]?.toolId ?? selectedToolPayload?.toolId ?? null
  const tool = getToolById(leadingToolId)

  return (
    <DisplayPanel className="rounded-3xl border-slate-200 bg-white/94 p-3 shadow-lg shadow-slate-900/6 backdrop-blur-xl">
      <DisplayPanelContent className="flex flex-wrap items-center justify-between gap-3 p-0">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">下一步</p>
          <p className="mt-1 text-sm font-black text-foreground">
            {tool ? `先打开 ${tool.name}，再决定是否沉淀。` : '先输入任务，让 DoraPocket 给出首选工具。'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {leadingToolId ? (
            <>
              <Button type="button" className="h-10 rounded-full px-4 text-xs font-bold" onClick={() => onLaunchCandidate(leadingToolId)}>
                立即执行
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
              <Button type="button" variant="outline" className="h-10 rounded-full px-4 text-xs font-bold" onClick={() => onSaveCandidate(leadingToolId)}>
                收入口袋
              </Button>
            </>
          ) : null}
          <Button type="button" variant="ghost" className="h-10 rounded-full px-4 text-xs font-bold" onClick={onOpenPocket}>
            <FolderOpenDot className="mr-1.5 h-3.5 w-3.5" />
            去复用
          </Button>
        </div>
      </DisplayPanelContent>
    </DisplayPanel>
  )
}
