import type { PocketState } from '@/server/agent/state'
import { formatCandidateLines, matchingSubmissionLines } from '@/server/agent/ui-payload'

function buildExplanationStyleInstruction(state: PocketState) {
  if (state.explanation_mode === 'brief') {
    return '解释风格：更短、更直接，先给结论；理由只保留必要信息；不要为了显得周到而堆砌铺垫。'
  }

  return '解释风格：保持 DoraPocket 默认表达，先结论、再理由、再动作；解释适中，不要过度扩写。'
}

export function buildDiscoveryResponsePrompt(state: PocketState) {
  return [
    `用户问题：${state.messages[state.messages.length - 1]?.content ?? ''}`,
    `任务模式：${state.task_frame.mode}`,
    `缺失参数：${state.task_frame.missingInputs.join('、') || '无'}`,
    `推荐理由：${state.selection_reason}`,
    `决策摘要：${state.ui_payload.decisionSummary ?? '无'}`,
    `首推依据：${state.ui_payload.whyThisFirst?.join('、') || '无'}`,
    `风险边界：${state.ui_payload.riskNotes?.join('、') || '无'}`,
    `社区证据：${state.ui_payload.communityEvidence?.join('、') || '无'}`,
    `个人证据：${state.ui_payload.personalEvidence?.join('、') || '无'}`,
    `用户偏好画像：${state.ui_payload.preferenceSignals.join('、') || '无'}`,
    `候选工具：\n${formatCandidateLines(state.candidate_tools)}`,
    `用户提交的市场条目：\n${matchingSubmissionLines(
      state.messages[state.messages.length - 1]?.content ?? '',
      state.market_context,
    )}`,
    buildExplanationStyleInstruction(state),
    '请输出：一句结论 + 最值得先用的工具 + 简短理由 + 代价或边界 + 下一步动作。不要堆列表，不要暴露内部 ID。',
    '如果首选是 Hub 外建议，必须明确说它当前不在 Tool Hub，不能说成已收录、可评价、可自动沉淀；下一步只能建议先打开试用，确认有效后再手动提交到 Tool Hub。',
  ].join('\n')
}
