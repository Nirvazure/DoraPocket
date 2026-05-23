import {
  DisplayPanel,
  DisplayPanelContent,
  DisplayPanelHeader,
  DisplayPanelTitle,
} from '@/components/ui/display-shell'
import { resolveAlternativeCandidates } from '@/components/discovery/analysis-stage-content'
import { getToolById } from '@/services/tool-registry'
import type { ChatToolPayload } from '@/services/llm'
import type { AgentUiPayload } from '@/shared/market-types'

type CandidateAlternativesCardProps = {
  payload: AgentUiPayload | null
  selectedToolPayload: ChatToolPayload
}

export function CandidateAlternativesCard({
  payload,
  selectedToolPayload,
}: CandidateAlternativesCardProps) {
  const alternatives = resolveAlternativeCandidates(payload, selectedToolPayload)

  return (
    <DisplayPanel className="rounded-[1.8rem] border-border/70 bg-white shadow-sm">
      <DisplayPanelHeader className="space-y-2">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
          本次出手里的备选
        </p>
        <DisplayPanelTitle className="text-xl text-foreground">
          如果你不想用这个，还有这些
        </DisplayPanelTitle>
      </DisplayPanelHeader>
      <DisplayPanelContent>
        {alternatives.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-3">
            {alternatives.map((candidate, index) => {
              const tool = candidate.toolId ? getToolById(candidate.toolId) : null
              return (
                <DisplayPanel
                  key={candidate.toolId ?? `${candidate.title}-${index}`}
                  className="rounded-2xl border-border/60 bg-slate-50 p-3 shadow-none"
                >
                  <p className="text-xs font-black text-foreground">
                    备选 {index + 1} · {tool?.name ?? candidate.title}
                  </p>
                  <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
                    {candidate.reason}
                  </p>
                </DisplayPanel>
              )
            })}
          </div>
        ) : (
          <DisplayPanel className="rounded-2xl border-dashed bg-slate-50 p-4 text-center text-xs font-semibold text-muted-foreground shadow-none">
            当前备选已压缩到最小集合，先试主推荐即可。
          </DisplayPanel>
        )}
      </DisplayPanelContent>
    </DisplayPanel>
  )
}
