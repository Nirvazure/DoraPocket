import { useState } from 'react'
import { CheckCircle2, ExternalLink, FolderOpenDot, RotateCw, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DisplayPanel, DisplayPanelContent, DisplayPanelHeader, DisplayPanelTitle } from '@/components/ui/display-shell'
import { getToolById } from '@/services/tool-registry'
import type { ChatToolPayload } from '@/services/llm'
import type { AgentUiPayload } from '@/shared/market-types'

type CompactDecisionPanelProps = {
  payload: AgentUiPayload | null
  selectedToolPayload: ChatToolPayload
  autoSaveNotice: { toolId: string; label: string } | null
  autoSaveEnabled: boolean
  onSaveCandidate: (toolId: string) => void
  onLaunchCandidate: (toolId: string) => void
  onOpenPocket: () => void
  onUndoAutoSave: () => void
  onEnableAutoSave: () => void
  onFeedback: (toolId: string, vote: 'up' | 'down') => void
}

const FEEDBACK_OPTIONS = ['解决了', '不适合', '太复杂', '太贵', '想换一个'] as const

export function CompactDecisionPanel({
  payload,
  selectedToolPayload,
  autoSaveNotice,
  autoSaveEnabled,
  onSaveCandidate,
  onLaunchCandidate,
  onOpenPocket,
  onUndoAutoSave,
  onEnableAutoSave,
  onFeedback,
}: CompactDecisionPanelProps) {
  const [selectedFeedback, setSelectedFeedback] = useState<string | null>(null)
  const leader = payload?.candidates[0] ?? null
  const leaderToolId = leader?.toolId ?? selectedToolPayload?.toolId ?? null
  const leaderTool = getToolById(leaderToolId)
  const alternatives = payload?.candidates.slice(1, 4) ?? []
  const title = leaderTool?.name ?? leader?.title ?? '等待主推荐'
  const reason =
    payload?.selectionReason ??
    'DoraPocket 会在分析任务后给出这次最值得先用的帮助。'

  const recordFeedback = (option: (typeof FEEDBACK_OPTIONS)[number]) => {
    setSelectedFeedback(option)
    if (!leaderToolId) return
    onFeedback(leaderToolId, option === '解决了' ? 'up' : 'down')
  }

  if (!payload && !selectedToolPayload?.toolId) {
    return (
      <DisplayPanel className="rounded-[2rem] border-dashed bg-white p-6 text-center shadow-sm">
        <DisplayPanelHeader className="p-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">推荐与行动</p>
          <DisplayPanelTitle className="mt-2 text-2xl">等待 DoraPocket 给出主推荐</DisplayPanelTitle>
        </DisplayPanelHeader>
        <DisplayPanelContent className="p-0 pt-2 text-sm text-muted-foreground">
          先完成任务输入和意图分析，这里会集中展示主推荐、备选和行动反馈。
        </DisplayPanelContent>
      </DisplayPanel>
    )
  }

  return (
    <DisplayPanel className="overflow-hidden rounded-[2rem] border-primary/15 bg-white shadow-xl shadow-primary/5">
      <div className="grid gap-0 xl:grid-cols-[1.25fr_0.75fr]">
        <DisplayPanel className="rounded-none border-0 bg-slate-950 p-5 text-white shadow-none sm:p-6">
          <Badge variant="dark" className="w-fit border-white/15 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-white/76">
            <Sparkles className="h-3.5 w-3.5" />
            现在先用
          </Badge>
          <DisplayPanelTitle className="mt-4 text-4xl leading-tight text-white">{title}</DisplayPanelTitle>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-white/74">{reason}</p>
          {payload?.selectionSignals.length ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {payload.selectionSignals.slice(0, 3).map((signal) => (
                <Badge key={signal} variant="dark" className="border-white/12 bg-white/10 px-3 py-1 text-[11px] font-semibold text-white/82">
                  {signal}
                </Badge>
              ))}
            </div>
          ) : null}
          {leaderToolId ? (
            <div className="mt-5 flex flex-wrap gap-2">
              <Button type="button" className="h-10 rounded-full bg-white px-4 text-xs font-bold text-slate-950 hover:bg-white/90" onClick={() => onLaunchCandidate(leaderToolId)}>
                <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                立即打开
              </Button>
              <Button type="button" variant="outline" className="h-10 rounded-full border-white/20 bg-white/10 px-4 text-xs font-bold text-white hover:bg-white/16" onClick={() => onSaveCandidate(leaderToolId)}>
                <FolderOpenDot className="mr-1.5 h-3.5 w-3.5" />
                收入口袋
              </Button>
            </div>
          ) : null}
        </DisplayPanel>

        <DisplayPanel className="flex flex-col gap-4 rounded-none border-x-0 border-b-0 border-t border-border/60 bg-slate-50 p-5 shadow-none xl:border-l xl:border-t-0">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">行动闭环</p>
            <p className="mt-2 text-sm font-semibold text-foreground">
              {autoSaveNotice
                ? `${autoSaveNotice.label} 已经进入口袋`
                : payload?.shouldAutoSave
                  ? '这次结果值得沉淀成下次可复用入口'
                  : '先试用，再决定是否沉淀'}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button type="button" size="sm" className="h-8 rounded-full px-3 text-[11px]" onClick={onOpenPocket}>
                查看口袋
              </Button>
              {autoSaveNotice ? (
                <Button type="button" size="sm" variant="outline" className="h-8 rounded-full bg-white px-3 text-[11px]" onClick={onUndoAutoSave}>
                  撤销
                </Button>
              ) : null}
              {!autoSaveEnabled ? (
                <Button type="button" size="sm" variant="outline" className="h-8 rounded-full bg-white px-3 text-[11px]" onClick={onEnableAutoSave}>
                  <RotateCw className="mr-1 h-3 w-3" />
                  开启自动沉淀
                </Button>
              ) : null}
            </div>
          </div>

          <DisplayPanel className="rounded-3xl border-border/60 bg-white p-3 shadow-none">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">这次解决了吗？</p>
              {selectedFeedback ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : null}
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {FEEDBACK_OPTIONS.map((option) => (
                <Button
                  key={option}
                  type="button"
                  variant={selectedFeedback === option ? 'default' : 'outline'}
                  className={
                    selectedFeedback === option
                      ? 'h-auto rounded-full px-2.5 py-1 text-[11px]'
                      : 'h-auto rounded-full border-border/70 bg-slate-50 px-2.5 py-1 text-[11px] text-foreground/75 hover:border-primary/25'
                  }
                  onClick={() => recordFeedback(option)}
                >
                  {option}
                </Button>
              ))}
            </div>
            {selectedFeedback ? <p className="mt-2 text-[11px] font-semibold text-muted-foreground">已记录：下次会参考这次反馈。</p> : null}
          </DisplayPanel>
        </DisplayPanel>
      </div>

      <DisplayPanel className="rounded-none border-x-0 border-b-0 border-t border-border/60 bg-white p-4 shadow-none">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">备选推荐</p>
            <p className="mt-1 text-xs text-muted-foreground">不是平级列表，只在条件变化时作为替换选项。</p>
          </div>
        </div>
        {alternatives.length > 0 ? (
          <div className="mt-3 grid gap-2 md:grid-cols-3">
            {alternatives.map((candidate, index) => {
              const tool = getToolById(candidate.toolId)
              return (
                <DisplayPanel key={candidate.toolId} className="rounded-2xl border-border/60 bg-slate-50 p-3 shadow-none">
                  <p className="text-xs font-black text-foreground">备选 {index + 1} · {tool?.name ?? candidate.title ?? candidate.toolId}</p>
                  <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">{candidate.reason}</p>
                </DisplayPanel>
              )
            })}
          </div>
        ) : (
          <DisplayPanel className="mt-3 rounded-2xl border-dashed bg-slate-50 p-4 text-center text-xs font-semibold text-muted-foreground shadow-none">
            当前备选已压缩到最小集合，先试主推荐即可。
          </DisplayPanel>
        )}
      </DisplayPanel>
    </DisplayPanel>
  )
}
