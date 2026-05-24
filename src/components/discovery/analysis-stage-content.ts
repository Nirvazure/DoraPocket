import { getToolById } from '@/shared/tool-registry'
import type { ChatToolPayload } from '@/lib/client/llm'
import type { AgentCandidate, AgentUiPayload } from '@/shared/market-types'
import type { AppState } from '@/store'

export type AnalysisStage = 'idle' | 'understanding' | 'judging' | 'covered' | 'revealing' | 'ready'
export type LiveAnalysisTrackStatus = 'done' | 'active' | 'pending'
export type LiveAnalysisTrackItem = {
  title: string
  detail: string
  meta?: string
  status: LiveAnalysisTrackStatus
}

export function resolveCurrentStep(stage: AnalysisStage, hasPrompt: boolean, hasResult: boolean) {
  if (!hasPrompt) return 1
  if (stage === 'idle') return hasResult ? 3 : 1
  if (stage === 'understanding') return 1
  if (stage === 'judging') return 2
  return 3
}

export function resolveMaxVisibleStep(
  stage: AnalysisStage,
  hasPrompt: boolean,
  hasResult: boolean,
) {
  if (!hasPrompt) return 1
  if (stage === 'idle') return hasResult ? 3 : 1
  if (stage === 'understanding') return 1
  if (stage === 'judging') return 2
  return 3
}

export function isStepDone(step: number, currentStep: number) {
  return step < currentStep
}

export function isRecommendationCovered(stage: AnalysisStage) {
  return stage === 'covered'
}

export function resolveLeadingCandidate(
  payload: AgentUiPayload | null,
  selectedToolPayload: ChatToolPayload,
) {
  return (
    payload?.candidates[0] ??
    (selectedToolPayload?.toolId
      ? ({
          toolId: selectedToolPayload.toolId,
          title: getToolById(selectedToolPayload.toolId)?.name ?? selectedToolPayload.toolId,
          candidateType: 'tool',
          score: 0,
          sourceLabel: 'builtin',
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

export function buildIntentUnderstanding(
  currentPrompt: string | null,
  payload: AgentUiPayload | null,
  appState: AppState,
) {
  const prompt = currentPrompt?.trim() ?? ''
  const goal = payload?.taskFrame.goal?.trim() ?? ''
  const base = goal || prompt

  if (!base) {
    return {
      heading: '还没有任务输入',
      detail: '先说出你这次要完成的任务，DoraPocket 才能开始理解并裁决。',
      bullets: [] as string[],
    }
  }

  const heading =
    payload != null
      ? `我先把这次任务判断为：${base}`
      : appState === 'thinking'
        ? `我正在把这个任务先翻译清楚：${base}`
        : `你现在要解决的是：${base}`

  const bullets =
    payload?.taskFrame.missingInputs?.slice(0, 2).map((item) => `还可以继续补充：${item}`) ?? []

  return {
    heading,
    detail:
      payload != null
        ? '接下来先往最匹配的工具方向收敛，再拿出一个最值得先用的主推荐。'
        : '我会先确认任务到底要解决什么，再决定这次该先拿出哪个道具。',
    bullets,
  }
}

export function buildDecisionRationale(
  payload: AgentUiPayload | null,
  selectedToolPayload: ChatToolPayload,
  appState: AppState,
) {
  const runnerUp = payload?.candidates[1]?.toolId ? getToolById(payload.candidates[1].toolId) : null
  const leaderToolId = payload?.candidates[0]?.toolId ?? selectedToolPayload?.toolId ?? null
  const leaderTool = leaderToolId ? getToolById(leaderToolId) : null

  const heading =
    payload?.selectionReason?.trim() ??
    (appState === 'thinking'
      ? '我正在判断这次应该先给你轻量入口，还是更完整但更重的方案。'
      : '我会先判断这次该走哪条路线，再决定先拿出哪个工具。')

  const rejection = runnerUp
    ? `这次不先给 ${runnerUp.name}，因为当前任务更需要更快开始、阻力更小的方案。`
    : leaderTool
      ? `我现在的判断是：先给 ${leaderTool.name} 这种更容易立即开用的方案。`
      : '我会先排除不适合当前任务节奏的方案，再收敛到最值得先试的一个。'

  const profileHint =
    payload?.preferenceSignals.length != null && payload.preferenceSignals.length > 0
      ? `你过往的偏好这次只作为轻量加权：${payload.preferenceSignals[0]}。`
      : '用户画像这一步只做轻微参考，不会压过当前任务本身。'

  return { heading, rejection, profileHint }
}

function resolveTrackStatus(index: number, activeIndex: number): LiveAnalysisTrackStatus {
  if (index < activeIndex) return 'done'
  if (index === activeIndex) return 'active'
  return 'pending'
}

function resolveActiveTrackIndex(stage: AnalysisStage, appState: AppState, hasPayload: boolean) {
  if (stage === 'understanding') return 0
  if (stage === 'judging') return appState === 'thinking' && !hasPayload ? 1 : 2
  if (stage === 'covered') return 3
  if (stage === 'revealing' || stage === 'ready') return 4
  return hasPayload ? 4 : 0
}

export function buildLiveAnalysisTrack({
  currentPrompt,
  payload,
  selectedToolPayload,
  appState,
  analysisStage,
}: {
  currentPrompt: string | null
  payload: AgentUiPayload | null
  selectedToolPayload: ChatToolPayload
  appState: AppState
  analysisStage: AnalysisStage
}): LiveAnalysisTrackItem[] {
  const prompt = currentPrompt?.trim()
  const goal = payload?.taskFrame.goal?.trim() || prompt || '等待任务输入'
  const activeIndex = resolveActiveTrackIndex(analysisStage, appState, Boolean(payload))
  const candidates = payload?.candidates ?? []
  const leadingCandidate = resolveLeadingCandidate(payload, selectedToolPayload)
  const missingInputs = payload?.taskFrame.missingInputs ?? []
  const preferenceHint = payload?.preferenceSignals[0]
  const selectionReason = payload?.selectionReason?.trim()

  return [
    {
      title: '理解任务',
      detail: prompt
        ? `先确认这次真正要解决的是：${goal}`
        : '先等待你给出任务，再开始判断这次该从哪里切入。',
      meta: prompt ? '已进入任务理解' : '还没有任务输入',
      status: resolveTrackStatus(0, activeIndex),
    },
    {
      title: '提取限制',
      detail:
        missingInputs.length > 0
          ? `还可以补充：${missingInputs.slice(0, 2).join('、')}。`
          : preferenceHint
            ? `轻量参考你的偏好：${preferenceHint}。`
            : '正在识别时间、登录、语言、准确度和开始门槛等限制。',
      meta: missingInputs.length > 0 ? '条件越清楚，裁决越稳' : undefined,
      status: resolveTrackStatus(1, activeIndex),
    },
    {
      title: '收束候选',
      detail:
        candidates.length > 0
          ? `已把候选收束到 ${candidates.length} 个方向，先保留最适合当前任务节奏的选择。`
          : '正在从工具、口袋和可行路径里排除不适合当前任务的选项。',
      meta: candidates.length > 1 ? '最终行动会在 Step 3 展示' : undefined,
      status: resolveTrackStatus(2, activeIndex),
    },
    {
      title: '准备推荐',
      detail:
        selectionReason ||
        leadingCandidate?.reason ||
        '正在把结论、理由和下一步动作整理成一次可执行的推荐。',
      meta: leadingCandidate?.title ? `主方向：${leadingCandidate.title}` : undefined,
      status: resolveTrackStatus(3, activeIndex),
    },
  ]
}

export function buildPrimaryRecommendation(
  payload: AgentUiPayload | null,
  selectedToolPayload: ChatToolPayload,
) {
  const leader = resolveLeadingCandidate(payload, selectedToolPayload)
  const leaderTool = leader?.toolId ? getToolById(leader.toolId) : null
  return {
    leader,
    title: leaderTool?.name ?? leader?.title ?? '等待 DoraPocket 正式出手',
    description:
      leader?.reason?.trim() ??
      payload?.selectionReason?.trim() ??
      '主推荐会在判断收敛后出现在这里。',
  }
}
