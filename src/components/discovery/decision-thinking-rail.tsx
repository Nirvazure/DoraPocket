import React from 'react'

import { Badge } from '@/components/ui/badge'
import { DisplayPanel, DisplayPanelContent } from '@/components/ui/display-shell'
import type { AgentUiPayload } from '@/shared/market-types'

type DecisionThinkingRailProps = {
  payload: AgentUiPayload | null
}

export function DecisionThinkingRail({ payload }: DecisionThinkingRailProps) {
  if (
    !payload ||
    (payload.preferenceSignals.length === 0 && payload.selectionSignals.length === 0)
  ) {
    return null
  }

  return (
    <DisplayPanel className="overflow-hidden rounded-[2rem] border-primary/15 bg-white p-4 shadow-lg shadow-primary/5">
      <DisplayPanelContent className="grid gap-3 p-0 md:grid-cols-2">
        <DisplayPanel className="rounded-3xl border-border/60 bg-slate-50 p-3 shadow-none">
          <p className="text-sm font-semibold text-foreground">适合你的信号</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {(payload.preferenceSignals.length ? payload.preferenceSignals : ['还在等待偏好信号'])
              .slice(0, 4)
              .map((signal) => (
                <Badge
                  key={signal}
                  variant="outline"
                  className="border-white/80 bg-white px-2.5 py-1 text-[11px] font-semibold text-foreground/75"
                >
                  {signal}
                </Badge>
              ))}
          </div>
        </DisplayPanel>
        <DisplayPanel className="rounded-3xl border-border/60 bg-slate-50 p-3 shadow-none">
          <p className="text-sm font-semibold text-foreground">这次首选依据</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {(payload.selectionSignals.length ? payload.selectionSignals : ['等待裁决信号'])
              .slice(0, 4)
              .map((signal) => (
                <Badge
                  key={signal}
                  variant="outline"
                  className="border-white/80 bg-white px-2.5 py-1 text-[11px] font-semibold text-foreground/75"
                >
                  {signal}
                </Badge>
              ))}
          </div>
        </DisplayPanel>
      </DisplayPanelContent>
    </DisplayPanel>
  )
}
