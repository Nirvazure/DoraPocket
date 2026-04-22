import { useState } from 'react'
import { CompactDecisionPanel } from '@/components/discovery/compact-decision-panel'
import { ContextInputCard } from '@/components/discovery/context-input-card'
import { DecisionProgressSteps } from '@/components/discovery/decision-progress-steps'
import { DecisionSummaryCard } from '@/components/discovery/decision-summary-card'
import { NextActionBar } from '@/components/discovery/next-action-bar'
import { TaskContextCard } from '@/components/discovery/task-context-card'
import { HelpStarterStrip } from '@/components/help-starter-panel'
import type { ChatToolPayload } from '@/services/llm'
import type { PocketInventoryItem } from '@/services/pocket-inventory'
import type { AgentUiPayload } from '@/shared/market-types'
import type { AppState } from '@/store'

type HeroMetricCard = {
  label: string
  value: number
  hint: string
}

type DiscoveryWorkspaceProps = {
  title: string
  description: string
  heroMetricCards: HeroMetricCard[]
  currentPrompt: string | null
  appState: AppState
  pocketRevealOpen: boolean
  agentPayload: AgentUiPayload | null
  selectedToolPayload: ChatToolPayload
  pocketInventory: PocketInventoryItem[]
  busyHint?: string
  autoSaveEnabled: boolean
  autoSaveNotice: { toolId: string; label: string } | null
  onToolEvent: (event: { type: string; message?: string }) => void
  onOpenPocket: () => void
  onOpenCandidate: (toolId: string) => void
  onSaveCandidate: (toolId: string) => void
  onSubscribeCandidate: (toolId: string) => void
  onLaunchCandidate: (toolId: string) => void
  onUndoAutoSave: () => void
  onDisableAutoSave: () => void
  onEnableAutoSave: () => void
  onDraftTask?: (draft: string) => void
}

export function DiscoveryWorkspace({
  title,
  description,
  heroMetricCards,
  currentPrompt,
  appState,
  pocketRevealOpen,
  agentPayload,
  selectedToolPayload,
  pocketInventory,
  busyHint,
  autoSaveEnabled,
  autoSaveNotice,
  onToolEvent,
  onOpenPocket,
  onOpenCandidate,
  onSaveCandidate,
  onSubscribeCandidate,
  onLaunchCandidate,
  onUndoAutoSave,
  onDisableAutoSave,
  onEnableAutoSave,
  onDraftTask,
}: DiscoveryWorkspaceProps) {
  const [stepViewState, setStepViewState] = useState({ suggestedStep: 1, activeStep: 1 })
  void pocketRevealOpen
  void pocketInventory
  void onToolEvent
  void onSubscribeCandidate
  void onDisableAutoSave

  void heroMetricCards
  void title
  void description
  const showStarterStrip = !currentPrompt?.trim() && !agentPayload
  const hasPrompt = Boolean(currentPrompt?.trim())
  const hasPayload = Boolean(agentPayload)
  const suggestedStep = hasPayload ? 3 : hasPrompt ? 2 : 1
  if (stepViewState.suggestedStep !== suggestedStep) {
    setStepViewState({ suggestedStep, activeStep: suggestedStep })
  }
  const activeStep = stepViewState.suggestedStep === suggestedStep ? stepViewState.activeStep : suggestedStep
  const setActiveStep = (step: number) => setStepViewState({ suggestedStep, activeStep: step })

  return (
    <section className="pointer-events-auto flex min-h-0 flex-col overflow-hidden rounded-[2rem] border border-white/80 bg-white/90 shadow-2xl shadow-slate-900/10 backdrop-blur-xl">
      <div className="shrink-0 border-b border-border/45 px-4 py-3 sm:px-5 sm:py-4">
        <DecisionProgressSteps currentStep={activeStep} onStepClick={setActiveStep} />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-3 [scrollbar-width:thin]">
        <div className="mx-auto flex max-w-6xl flex-col gap-4">
          {activeStep === 1 ? (
            showStarterStrip && onDraftTask ? (
              <HelpStarterStrip onDraftChange={onDraftTask} />
            ) : currentPrompt?.trim() ? (
              <TaskContextCard currentPrompt={currentPrompt.trim()} />
            ) : null
          ) : null}

          {activeStep === 2 ? (
            <div className="space-y-4">
              <DecisionSummaryCard payload={agentPayload} currentPrompt={currentPrompt} appState={appState} busyHint={busyHint} />
              <ContextInputCard payload={agentPayload} />
            </div>
          ) : null}

          {activeStep === 3 ? (
            <CompactDecisionPanel
              payload={agentPayload}
              selectedToolPayload={selectedToolPayload}
              autoSaveNotice={autoSaveNotice}
              autoSaveEnabled={autoSaveEnabled}
              onOpenCandidate={onOpenCandidate}
              onSaveCandidate={onSaveCandidate}
              onLaunchCandidate={onLaunchCandidate}
              onOpenPocket={onOpenPocket}
              onUndoAutoSave={onUndoAutoSave}
              onEnableAutoSave={onEnableAutoSave}
            />
          ) : null}
        </div>
      </div>

      <div className="shrink-0 px-5 pb-5">
        <NextActionBar
          payload={agentPayload}
          selectedToolPayload={selectedToolPayload}
          onLaunchCandidate={onLaunchCandidate}
          onSaveCandidate={onSaveCandidate}
          onOpenPocket={onOpenPocket}
        />
      </div>
    </section>
  )
}
