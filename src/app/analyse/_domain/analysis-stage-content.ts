import type { ToolLookupFn } from '@/shared/market/tool-lookup'
import type { ToolItem } from '@/shared/market/tool-registry'
import type { ChatToolPayload } from '@/lib/client/llm'
import type { AgentCandidate, AgentUiPayload } from '@/shared/market/market-types'
import type { ClarificationSession } from '@/shared/discovery/clarification-session-types'
import type { AppState } from '@/store'

export type AnalysisPhase = 'idle' | 'analyzing' | 'revealed'
export type AnalysisBeat = 'working' | 'cover' | 'reveal'

export type AnalysisFlow = {
  phase: AnalysisPhase
  beat: AnalysisBeat
  clarification?: ClarificationSession
}

export const IDLE_ANALYSIS_FLOW: AnalysisFlow = { phase: 'idle', beat: 'working' }

export function isAnalyzingFlow(flow: AnalysisFlow) {
  return flow.phase === 'analyzing'
}

export function resolveAnalysisFlowAfterError(): AnalysisFlow {
  return { phase: 'idle', beat: 'working' }
}

export function isClarificationActive(flow: AnalysisFlow): boolean {
  return flow.clarification?.status === 'clarifying'
}

export function isInputLockedFlow(flow: AnalysisFlow): boolean {
  if (isClarificationActive(flow)) return false
  return flow.phase === 'analyzing'
}

/** 顶栏 Step 1/2/3：Step 2 只确认理解；推荐生成与等待态都归到 Step 3。 */
function resolveDecisionPanelStep(
  flow: AnalysisFlow,
  hasPrompt: boolean,
  hasResult: boolean,
): number {
  if (!hasPrompt) return 1
  if (flow.phase === 'idle') return hasResult ? 3 : 2
  if (flow.phase === 'revealed') return 3
  if (flow.phase === 'analyzing') return 3
  return 3
}

export function shouldPreserveTurnFlow(flow: AnalysisFlow) {
  return flow.phase === 'revealed' || (flow.phase === 'analyzing' && flow.beat !== 'working')
}

export function resolveCurrentStep(flow: AnalysisFlow, hasPrompt: boolean, hasResult: boolean) {
  return resolveDecisionPanelStep(flow, hasPrompt, hasResult)
}

export function resolveMaxVisibleStep(flow: AnalysisFlow, hasPrompt: boolean, hasResult: boolean) {
  return resolveDecisionPanelStep(flow, hasPrompt, hasResult)
}

export function isStepDone(step: number, currentStep: number) {
  return step < currentStep
}

export function isRecommendationCovered(flow: AnalysisFlow) {
  return flow.phase === 'analyzing' && flow.beat === 'cover'
}

export function isRecommendationRevealing(flow: AnalysisFlow) {
  return flow.phase === 'analyzing' && flow.beat === 'reveal'
}

export function resolvePocketBarCopy(flow: AnalysisFlow) {
  if (flow.phase !== 'analyzing') {
    return { title: '翻口袋中', detail: '正在收敛方向' }
  }
  if (flow.beat === 'reveal') {
    return { title: '出手', detail: '准备正式揭晓' }
  }
  if (flow.beat === 'cover') {
    return { title: '翻口袋中', detail: '已经摸到一个合适的道具' }
  }
  return { title: '翻口袋中', detail: '正在收敛方向' }
}

export function resolveAnalysisStatusDetail(flow: AnalysisFlow): string | null {
  if (flow.phase === 'analyzing') {
    if (flow.beat === 'cover') return '正在翻口袋'
    if (flow.beat === 'reveal') return '准备正式出手'
    return '正在做出判断'
  }
  if (flow.phase === 'revealed') return '本次出手已到位'
  return null
}

export function shouldShowAnalysisLoadingDots(flow: AnalysisFlow, appState: AppState) {
  return (
    appState === 'thinking' ||
    (flow.phase === 'analyzing' && (flow.beat === 'working' || flow.beat === 'cover'))
  )
}

function resolveTool(
  getTool: ToolLookupFn | undefined,
  id: string | null | undefined,
): ToolItem | null {
  if (!id) return null
  return getTool?.(id) ?? null
}

export function resolveLeadingCandidate(
  payload: AgentUiPayload | null,
  selectedToolPayload: ChatToolPayload,
  getTool?: ToolLookupFn,
) {
  return (
    payload?.candidates[0] ??
    (selectedToolPayload?.toolId
      ? ({
          toolId: selectedToolPayload.toolId,
          title:
            resolveTool(getTool, selectedToolPayload.toolId)?.name ?? selectedToolPayload.toolId,
          candidateType: 'tool',
          score: 0,
          sourceLabel: 'market',
          reason: '',
        } satisfies AgentCandidate)
      : null)
  )
}

export function resolveAlternativeCandidates(
  payload: AgentUiPayload | null,
  selectedToolPayload: ChatToolPayload,
) {
  const candidates = payload?.candidates.slice(1, 4) ?? []
  if (candidates.length > 0) return candidates
  if (!selectedToolPayload?.toolId) return []
  return []
}

export function buildPrimaryRecommendation(
  payload: AgentUiPayload | null,
  selectedToolPayload: ChatToolPayload,
  getTool?: ToolLookupFn,
) {
  const leader = resolveLeadingCandidate(payload, selectedToolPayload, getTool)
  const leaderTool = leader?.toolId ? resolveTool(getTool, leader.toolId) : null
  return {
    leader,
    title: leaderTool?.name ?? leader?.title ?? '等待 DoraPocket 正式出手',
    description:
      leader?.reason?.trim() ??
      payload?.selectionReason?.trim() ??
      '主推荐会在判断收敛后出现在这里。',
  }
}
