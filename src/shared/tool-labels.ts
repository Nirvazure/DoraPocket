import type {
  ToolCategory,
  ToolExecutionMode,
  ToolPricingModel,
  ToolSource,
} from '@/shared/tool-registry'

export const TOOL_CATEGORY_LABELS: Record<ToolCategory, string> = {
  ai_assistant: 'AI 助手',
  search: '资料搜索',
  developer: '开发工具',
  design: '设计素材',
  productivity: '效率办公',
  media: '媒体处理',
  learning: '学习研究',
  writing: '写作翻译',
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
]

export const TOOL_SOURCE_LABELS: Record<ToolSource, string> = {
  builtin: '原生能力',
  market: '市场精选',
  submitted: '用户提交',
  imported: '导入工具',
  external_resource: '参考资源',
  official: '官方资源',
}

export const TOOL_PREFERENCE_LABELS: Record<
  ToolCategory | ToolPricingModel | ToolExecutionMode,
  string
> = {
  ...TOOL_CATEGORY_LABELS,
  free: '免费优先',
  freemium: '可先试用',
  paid: '接受付费',
  subscription: '长期订阅',
  native_card: '站内卡片',
  external_link: '外部工具',
  workflow: '流程方案',
  reference_only: '仅参考资料',
}
