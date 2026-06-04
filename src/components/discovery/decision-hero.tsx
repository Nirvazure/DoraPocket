import { ExternalLink, FolderOpenDot, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MarketToolIcon } from '@/components/market/market-tool-icon'
import {
  DisplayPanel,
  DisplayPanelContent,
  DisplayPanelHeader,
  DisplayPanelTitle,
} from '@/components/ui/display-shell'
import type { ToolLookupFn } from '@/shared/tool-lookup'
import type { AgentUiPayload } from '@/shared/market-types'
import type { ChatToolPayload } from '@/lib/client/llm'

type DecisionHeroProps = {
  payload: AgentUiPayload | null
  selectedToolPayload: ChatToolPayload
  getTool: ToolLookupFn
  currentPrompt: string | null
  onLaunchCandidate: (toolId: string) => void
  onOpenExternalCandidate: (url: string) => void
  onSaveCandidate: (toolId: string) => void
  onOpenCandidate: (toolId: string) => void
}

function fallbackTitle(currentPrompt: string | null) {
  if (currentPrompt?.trim()) return '正在为这个任务做工具裁决'
  return '告诉我任务，我替你选工具'
}

export function DecisionHero({
  payload,
  selectedToolPayload,
  getTool,
  currentPrompt,
  onLaunchCandidate,
  onOpenExternalCandidate,
  onSaveCandidate,
  onOpenCandidate,
}: DecisionHeroProps) {
  const leadingCandidate = payload?.candidates[0] ?? null
  const leadingToolId = leadingCandidate?.toolId ?? selectedToolPayload?.toolId ?? null
  const leadingExternalUrl =
    leadingCandidate?.candidateType === 'external_suggestion'
      ? (leadingCandidate.url ?? null)
      : null
  const leadingTool = getTool(leadingToolId)
  const runnerUp = payload?.candidates[1]?.toolId ? getTool(payload.candidates[1].toolId) : null
  const title = leadingTool?.name ?? leadingCandidate?.title ?? fallbackTitle(currentPrompt)
  const reason =
    payload?.selectionReason ?? '输入任务后，DoraPocket 会先比较候选，再给出当前最值得用的工具。'
  const reverseReason = runnerUp
    ? `不是先用 ${runnerUp.name}：这一轮首选在上手成本、匹配度或复用价值上更稳。`
    : '不是先给你一堆列表：本页会先给裁决，再给备选和理由。'

  return (
    <DisplayPanel className="relative overflow-hidden rounded-[2rem] border-primary/25 bg-[linear-gradient(145deg,hsl(200_85%_28%)_0%,hsl(199_90%_22%)_48%,hsl(201_95%_16%)_100%)] px-5 py-5 text-white shadow-[0_24px_60px_-16px_hsl(var(--primary)/0.45)] sm:px-6 sm:py-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(80,171,255,0.34),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.12),transparent_42%)]" />
      <div className="relative z-10">
        <Badge className="w-fit border-white/15 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-white/80">
          <Sparkles className="h-3.5 w-3.5" />
          当前裁决
        </Badge>
        <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_auto] xl:items-end">
          <DisplayPanelHeader className="p-0">
            <div className="flex items-start gap-4">
              {leadingTool ? <MarketToolIcon tool={leadingTool} size="md" /> : null}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white/65">现在先用</p>
                <DisplayPanelTitle className="mt-2 text-4xl leading-none text-white sm:text-5xl">
                  {title}
                </DisplayPanelTitle>
                <p className="mt-4 max-w-3xl text-sm leading-7 text-white/76">{reason}</p>
                <DisplayPanel className="mt-3 max-w-3xl rounded-2xl border-white/12 bg-white/8 px-4 py-3 text-xs leading-relaxed text-white/72 shadow-none">
                  {reverseReason}
                </DisplayPanel>
              </div>
            </div>
          </DisplayPanelHeader>
          <DisplayPanelContent className="flex flex-wrap gap-2 p-0 xl:w-52 xl:flex-col">
            {leadingExternalUrl ? (
              <Button
                type="button"
                className="h-11 rounded-full bg-white px-5 text-sm font-bold text-slate-950 hover:bg-white/90"
                onClick={() => onOpenExternalCandidate(leadingExternalUrl)}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                打开外部工具
              </Button>
            ) : leadingToolId ? (
              <>
                <Button
                  type="button"
                  className="h-11 rounded-full bg-white px-5 text-sm font-bold text-slate-950 hover:bg-white/90"
                  onClick={() => onLaunchCandidate(leadingToolId)}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  立即打开
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 rounded-full border-white/25 bg-white/10 px-5 text-sm font-bold text-white hover:bg-white/16"
                  onClick={() => onSaveCandidate(leadingToolId)}
                >
                  <FolderOpenDot className="mr-2 h-4 w-4" />
                  收入口袋
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="h-10 rounded-full px-5 text-xs font-semibold text-white/72 hover:bg-white/10 hover:text-white"
                  onClick={() => onOpenCandidate(leadingToolId)}
                >
                  查看比较依据
                </Button>
              </>
            ) : (
              <Badge className="border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold text-white/76">
                等待任务输入
              </Badge>
            )}
          </DisplayPanelContent>
        </div>
      </div>
    </DisplayPanel>
  )
}
