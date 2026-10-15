import type { ToolCategory, ToolPricingModel } from '@/shared/market/tool-registry'

export const TOOL_CATEGORY_LABELS: Record<ToolCategory, string> = {
  ai_assistant: 'AI 助手',
  search: '资料搜索',
  developer: '开发工具',
  design: '设计素材',
  productivity: '效率办公',
  media: '媒体处理',
  learning: '学习研究',
  writing: '写作翻译',
  other: '其他工具',
}

export const TOOL_CATEGORY_ORDER: ToolCategory[] = [
  'ai_assistant',
  'search',
  'developer',
  'design',
  'productivity',
  'media',
  'learning',
  'writing',
  'other',
]

export const TOOL_PREFERENCE_LABELS: Record<ToolCategory | ToolPricingModel, string> = {
  ...TOOL_CATEGORY_LABELS,
  free: '免费优先',
  freemium: '可先试用',
  paid: '接受付费',
  subscription: '长期订阅',
  unknown: '价格待确认',
}
