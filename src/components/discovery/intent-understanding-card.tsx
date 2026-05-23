import { Loader2, SearchCheck } from 'lucide-react'
import {
  DisplayPanel,
  DisplayPanelContent,
  DisplayPanelDescription,
  DisplayPanelHeader,
  DisplayPanelTitle,
} from '@/components/ui/display-shell'
import {
  buildIntentUnderstanding,
  type AnalysisStage,
} from '@/components/discovery/analysis-stage-content'
import type { AgentUiPayload } from '@/shared/market-types'
import type { AppState } from '@/store'

type IntentUnderstandingCardProps = {
  currentPrompt: string | null
  payload: AgentUiPayload | null
  appState: AppState
  analysisStage: AnalysisStage
}

export function IntentUnderstandingCard({
  currentPrompt,
  payload,
  appState,
  analysisStage,
}: IntentUnderstandingCardProps) {
  const content = buildIntentUnderstanding(currentPrompt, payload, appState)
  const showThinking =
    analysisStage === 'understanding' && Boolean(currentPrompt?.trim()) && !payload

  return (
    <DisplayPanel className="rounded-[1.8rem] border-primary/15 bg-primary/[0.04] shadow-sm">
      <DisplayPanelHeader className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
              步骤 1 / 理解任务
            </p>
            <DisplayPanelTitle className="mt-2 text-xl text-foreground">
              {content.heading}
            </DisplayPanelTitle>
          </div>
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/[0.08] text-primary">
            {showThinking ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <SearchCheck className="h-4 w-4" />
            )}
          </span>
        </div>
        <DisplayPanelDescription className="text-sm leading-7 text-muted-foreground">
          {content.detail}
        </DisplayPanelDescription>
      </DisplayPanelHeader>
      {content.bullets.length > 0 ? (
        <DisplayPanelContent className="space-y-2 pt-0">
          {content.bullets.map((bullet) => (
            <p
              key={bullet}
              className="rounded-2xl border border-border/60 bg-white/80 px-3 py-2 text-xs font-semibold text-foreground/78"
            >
              {bullet}
            </p>
          ))}
        </DisplayPanelContent>
      ) : null}
    </DisplayPanel>
  )
}
