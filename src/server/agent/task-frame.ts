import type { AgentTaskFrame } from '@/shared/market/market-types'
import { extractColdStartTaskLine } from '@/shared/discovery/starter-intake'

const POCKET_KEYWORDS = ['收藏', '口袋'] as const
const DISCOVERY_KEYWORDS = ['工具', '推荐', '找个', '网站', '资源', '怎么找'] as const
const BROAD_DISCOVERY_PATTERNS = [/推荐一个\s*ai\s*工具/i, /找一个\s*ai\s*工具/i, /推荐.*工具$/i]

function resolveGoalText(userText: string): string {
  const text = userText.trim()
  if (text.includes('【冷启动】')) {
    return extractColdStartTaskLine(text)
  }
  return text
}

function extractColdStartLine(userText: string, label: string): string | null {
  const match = userText.match(new RegExp(`${label}：([^\\n]+)`))
  return match?.[1]?.trim() ?? null
}

function splitConstraints(raw: string | null): string[] {
  if (!raw || raw === '无特别约束' || raw === '无') return []
  return raw
    .split(/[、,，/]/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function includesAny(text: string, keywords: string[]) {
  return keywords.some((keyword) => text.includes(keyword))
}

export function buildTaskFrame(userText: string): AgentTaskFrame {
  const goal = resolveGoalText(userText)
  const lower = goal.toLowerCase()
  const fullText = userText.trim()
  const fullLower = fullText.toLowerCase()
  const coldStartRole = extractColdStartLine(fullText, '身份')
  const coldStartConstraints = splitConstraints(extractColdStartLine(fullText, '约束'))
  const constraints = new Set<string>(coldStartConstraints)
  const missingInputs: string[] = []
  const confidenceDrivers: string[] = []

  const budgetPreference: AgentTaskFrame['budgetPreference'] = includesAny(fullLower, [
    '免费优先',
    '免费',
    'free',
  ])
    ? 'free_first'
    : includesAny(fullLower, ['可接受订阅', '订阅'])
      ? 'subscription_ok'
      : includesAny(fullLower, ['按量付费'])
        ? 'pay_as_you_go'
        : includesAny(fullLower, ['企业预算'])
          ? 'enterprise_budget'
          : null
  const authPreference: AgentTaskFrame['authPreference'] = includesAny(fullLower, [
    '免注册优先',
    '免注册',
    '不用注册',
  ])
    ? 'no_signup'
    : includesAny(fullLower, ['可以注册', '接受注册'])
      ? 'signup_ok'
      : null
  const evidenceRequirement: AgentTaskFrame['evidenceRequirement'] = includesAny(fullLower, [
    '要附来源',
    '引用',
    '来源',
    '可核验',
  ])
    ? 'citations'
    : includesAny(fullLower, ['不需要引用'])
      ? 'not_required'
      : null
  const languagePreference: AgentTaskFrame['languagePreference'] = includesAny(fullLower, [
    '中文体验',
    '中文优先',
    '中文',
  ])
    ? 'chinese'
    : includesAny(fullLower, ['英文也可以'])
      ? 'english_ok'
      : null
  const platformPreference: AgentTaskFrame['platformPreference'] = includesAny(fullLower, [
    '需要 api',
    'api',
  ])
    ? 'api'
    : includesAny(fullLower, ['移动端', '手机'])
      ? 'mobile'
      : includesAny(fullLower, ['网页端', 'web'])
        ? 'web'
        : null
  const urgency: AgentTaskFrame['urgency'] = includesAny(fullLower, [
    '最快上手',
    '快速开始',
    '立刻开始',
  ])
    ? 'fast_start'
    : includesAny(fullLower, ['结果质量优先', '质量优先'])
      ? 'quality_first'
      : 'unspecified'

  if (budgetPreference === 'free_first') constraints.add('免费优先')
  if (authPreference === 'no_signup') constraints.add('免注册优先')
  if (evidenceRequirement === 'citations') constraints.add('要附来源')
  if (languagePreference === 'chinese') constraints.add('中文体验')
  if (platformPreference === 'api') constraints.add('需要 API')
  if (platformPreference === 'mobile') constraints.add('移动端优先')
  if (includesAny(fullLower, ['隐私敏感', '隐私安全', '安全'])) constraints.add('隐私敏感')
  if (includesAny(fullLower, ['小团队', '团队协作'])) constraints.add('小团队')
  if (urgency === 'fast_start') constraints.add('最快上手')

  const broad = BROAD_DISCOVERY_PATTERNS.some((pattern) => pattern.test(goal.trim()))
  if (broad) {
    confidenceDrivers.push('任务描述过泛')
    missingInputs.push('使用场景')
  }
  if (broad && !budgetPreference) missingInputs.push('预算偏好')
  if (broad && !authPreference) missingInputs.push('注册偏好')

  const base = {
    goal,
    missingInputs: missingInputs.slice(0, 3),
    role: coldStartRole,
    scenario: broad ? null : goal,
    constraints: [...constraints],
    budgetPreference,
    authPreference,
    languagePreference,
    evidenceRequirement,
    platformPreference,
    urgency,
    confidenceDrivers,
  }

  if (POCKET_KEYWORDS.some((keyword) => lower.includes(keyword))) {
    return { ...base, mode: 'manage_pocket' }
  }

  if (DISCOVERY_KEYWORDS.some((keyword) => lower.includes(keyword))) {
    return { ...base, mode: 'discover' }
  }

  return { ...base, mode: 'discover' }
}
