import type { AgentUiPayload, MarketContext } from '@/shared/market/market-types'
import type { ExplanationMode } from '@/shared/user/user-settings'
import { formatCandidateLines, matchingSubmissionLines } from '@/server/agent/ui-payload'

function buildExplanationStyleInstruction(explanationMode: ExplanationMode) {
  if (explanationMode === 'brief') {
    return '解释风格：更短、更直接，先给结论；理由只保留必要信息；不要为了显得周到而堆砌铺垫。'
  }

  return '解释风格：保持 DoraPocket 默认表达，先结论、再理由、再动作；解释适中，不要过度扩写。'
}

export function buildDiscoveryResponsePrompt({
  message,
  uiPayload,
  marketContext,
  explanationMode,
}: {
  message: string
  uiPayload: AgentUiPayload
  marketContext: MarketContext
  explanationMode: ExplanationMode
}) {
  return [
    `用户问题：${message}`,
    `任务模式：${uiPayload.taskFrame.mode}`,
    `缺失参数：${uiPayload.taskFrame.missingInputs.join('、') || '无'}`,
    `推荐理由：${uiPayload.selectionReason}`,
    `决策摘要：${uiPayload.decisionSummary ?? '无'}`,
    `首推依据：${uiPayload.whyThisFirst?.join('、') || '无'}`,
    `风险边界：${uiPayload.riskNotes?.join('、') || '无'}`,
    `社区证据：${uiPayload.communityEvidence?.join('、') || '无'}`,
    `个人证据：${uiPayload.personalEvidence?.join('、') || '无'}`,
    `用户偏好画像：${uiPayload.preferenceSignals.join('、') || '无'}`,
    `候选工具：\n${formatCandidateLines(uiPayload.candidates)}`,
    `用户提交的市场条目：\n${matchingSubmissionLines(message, marketContext)}`,
    buildExplanationStyleInstruction(explanationMode),
    '请输出：一句结论 + 最值得先用的工具 + 简短理由 + 代价或边界 + 下一步动作。不要堆列表，不要暴露内部 ID。',
    '如果首选是 Hub 外建议，必须明确说它当前不在 Tool Hub，不能说成已收录、可评价、可自动沉淀；下一步只能建议先打开试用，确认有效后再手动提交到 Tool Hub。',
  ].join('\n')
}
