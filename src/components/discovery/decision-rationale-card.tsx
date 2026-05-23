import { Compass, Loader2 } from 'lucide-react'
import {
  DisplayPanel,
  DisplayPanelContent,
  DisplayPanelDescription,
  DisplayPanelHeader,
  DisplayPanelTitle,
} from '@/components/ui/display-shell'
import {
  buildDecisionRationale,
  type AnalysisStage,
} from '@/components/discovery/analysis-stage-content'
import type { ChatToolPayload } from '@/services/llm'
import type { AgentUiPayload } from '@/shared/market-types'
import type { AppState } from '@/store'

type DecisionRationaleCardProps = {
  payload: AgentUiPayload | null
  selectedToolPayload: ChatToolPayload
  appState: AppState
  analysisStage: AnalysisStage
}

export function DecisionRationaleCard({
  payload,
  selectedToolPayload,
  appState,
  analysisStage,
}: DecisionRationaleCardProps) {
  const content = buildDecisionRationale(payload, selectedToolPayload, appState)
  const judging = analysisStage === 'judging' && payload == null

  return (
    <DisplayPanel className="rounded-[1.8rem] border-border/70 bg-white shadow-sm">
      <DisplayPanelHeader className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
              步骤 2 / 做出判断
            </p>
            <DisplayPanelTitle className="mt-2 text-xl text-foreground">
              {content.heading}
            </DisplayPanelTitle>
          </div>
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-primary">
            {judging ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Compass className="h-4 w-4" />
            )}
          </span>
        </div>
        <DisplayPanelDescription className="text-sm leading-7 text-muted-foreground">
          这一步只说明我为什么按这个方向出手，而不是把候选列表提前铺满页面。
        </DisplayPanelDescription>
      </DisplayPanelHeader>
      <DisplayPanelContent className="grid gap-3 md:grid-cols-2">
        <div className="rounded-3xl border border-border/60 bg-slate-50/90 p-4">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">本次判断</p>
          <p className="mt-2 text-sm font-semibold leading-7 text-foreground">
            {content.rejection}
          </p>
        </div>
        <div className="rounded-3xl border border-border/60 bg-slate-50/90 p-4">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">轻量偏好加权</p>
          <p className="mt-2 text-sm font-semibold leading-7 text-foreground">
            {content.profileHint}
          </p>
        </div>
      </DisplayPanelContent>
    </DisplayPanel>
  )
}
