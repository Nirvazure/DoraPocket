import type { PocketState } from '@/server/agent/state'
import { formatCandidateLines, matchingSubmissionLines } from '@/server/agent/ui-payload'

export function buildBuiltinResponsePrompt(state: PocketState) {
  return [
    `用户问题：${state.messages[state.messages.length - 1]?.content ?? ''}`,
    `工具结果：${state.tool_result}`,
    `选择理由：${state.selection_reason}`,
    '请用简洁方式回答，并补一句“下一步可做什么”。',
  ].join('\n')
}

export function buildDiscoveryResponsePrompt(state: PocketState) {
  return [
    `用户问题：${state.messages[state.messages.length - 1]?.content ?? ''}`,
    `任务模式：${state.task_frame.mode}`,
    `缺失参数：${state.task_frame.missingInputs.join('、') || '无'}`,
    `推荐理由：${state.selection_reason}`,
    `用户偏好画像：${state.ui_payload.preferenceSignals.join('、') || '无'}`,
    `候选工具：\n${formatCandidateLines(state.candidate_tools)}`,
    `用户提交的市场条目：\n${matchingSubmissionLines(
      state.messages[state.messages.length - 1]?.content ?? '',
      state.market_context,
    )}`,
    '请输出：一句总判断 + 最值得试的工具 + 为什么 + 建议下一步。',
  ].join('\n')
}
