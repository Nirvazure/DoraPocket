export type StarterRoleId =
  | 'founder'
  | 'marketer'
  | 'developer'
  | 'designer'
  | 'sales'
  | 'hr'
  | 'finance'
  | 'operations'
  | 'other'

export type StarterConstraintId =
  | 'solo'
  | 'small_team'
  | 'mid_team'
  | 'enterprise'
  | 'free_first'
  | 'subscription_ok'
  | 'pay_as_you_go'
  | 'enterprise_budget'
  | 'no_ads'
  | 'ads_acceptable'
  | 'privacy_sensitive'
  | 'no_signup'
  | 'citations'
  | 'fast_start'
  | 'chinese'
  | 'api_needed'
  | 'mobile_first'

export type StarterOutcomeId =
  | 'research_citations'
  | 'structure_content'
  | 'office_tools'
  | 'writing'
  | 'design_assets'
  | 'data_analytics'
  | 'workflow_automation'
  | 'video_audio'
  | 'support_email'
  | 'knowledge_learning'

export type StarterOutcome = {
  id: StarterOutcomeId
  title: string
  description: string
  taskPrompt: string
}

export type StarterIntake = {
  roleId: StarterRoleId | null
  outcomeId: StarterOutcomeId | null
  customTask: string
  constraintIds: StarterConstraintId[]
}

export type StarterIntakeDraft = StarterIntake & {
  sourceText: string
  missingInputs?: string[]
  confidence?: Partial<Record<'role' | 'goal' | 'constraints', number>>
  reasoningSummary?: string
  source?: 'model' | 'fallback'
}

export type StarterIntentStatus = 'idle' | 'analyzing' | 'ready' | 'fallback'

export type StarterPromptTemplate = {
  id: string
  title: string
  description: string
  prompt: string
}

export const STARTER_ROLES: Array<{ id: StarterRoleId; label: string; emoji: string }> = [
  { id: 'founder', label: '创始人 / 负责人', emoji: '🚀' },
  { id: 'marketer', label: '市场 / 运营', emoji: '📣' },
  { id: 'developer', label: '开发', emoji: '💻' },
  { id: 'designer', label: '设计', emoji: '🎨' },
  { id: 'sales', label: '销售', emoji: '🤝' },
  { id: 'hr', label: '人力 / 招聘', emoji: '💼' },
  { id: 'finance', label: '财务 / 运营', emoji: '💰' },
  { id: 'operations', label: '流程 / 协作', emoji: '📐' },
  { id: 'other', label: '其他', emoji: '✨' },
]

export type StarterConstraintDimension = {
  id: string
  title: string
  hint: string
  options: Array<{ id: StarterConstraintId; label: string }>
}

export const STARTER_CONSTRAINT_DIMENSIONS: StarterConstraintDimension[] = [
  {
    id: 'team',
    title: '团队规模',
    hint: '不同规模对协作、权限和管理要求不一样。',
    options: [
      { id: 'solo', label: '个人独立' },
      { id: 'small_team', label: '小团队 (2-10)' },
      { id: 'mid_team', label: '中型团队' },
      { id: 'enterprise', label: '大企业' },
    ],
  },
  {
    id: 'pricing',
    title: '收费方式',
    hint: '预算和付费模式会直接影响推荐排序。',
    options: [
      { id: 'free_first', label: '免费优先' },
      { id: 'subscription_ok', label: '可接受订阅' },
      { id: 'pay_as_you_go', label: '按量付费' },
      { id: 'enterprise_budget', label: '企业预算' },
    ],
  },
  {
    id: 'ads',
    title: '广告与隐私',
    hint: '是否接受广告、数据如何处理，也会影响取舍。',
    options: [
      { id: 'no_ads', label: '无广告优先' },
      { id: 'ads_acceptable', label: '可接受广告' },
      { id: 'privacy_sensitive', label: '隐私敏感' },
    ],
  },
  {
    id: 'experience',
    title: '上手与体验',
    hint: '从注册门槛到语言环境，决定这次能不能立刻开始。',
    options: [
      { id: 'no_signup', label: '免注册优先' },
      { id: 'fast_start', label: '最快开始' },
      { id: 'chinese', label: '中文体验' },
      { id: 'mobile_first', label: '移动端优先' },
    ],
  },
  {
    id: 'output',
    title: '输出与集成',
    hint: '结果要不要可追溯，以及要不要接进现有流程。',
    options: [
      { id: 'citations', label: '要附来源' },
      { id: 'api_needed', label: '需要 API' },
    ],
  },
]

export const STARTER_CONSTRAINTS: Array<{ id: StarterConstraintId; label: string }> =
  STARTER_CONSTRAINT_DIMENSIONS.flatMap((dimension) => dimension.options)

export const STARTER_OUTCOMES: StarterOutcome[] = [
  {
    id: 'research_citations',
    title: '查资料，要可靠引用',
    description: '需要出处、对比和可核验来源。',
    taskPrompt: '我需要查资料并希望结果带可靠引用，请判断这次先用哪个工具。',
  },
  {
    id: 'structure_content',
    title: '整理长文，产出结构',
    description: '总结、抽取、会议纪要等结构化输出。',
    taskPrompt: '我有一段内容需要整理成清晰结构，请判断这次更适合的路径。',
  },
  {
    id: 'office_tools',
    title: '办公小工具选型',
    description: 'PDF、翻译、摘要、去背景等低摩擦任务。',
    taskPrompt: '我有一个办公效率小任务，请给出这次最值得先试的工具。',
  },
  {
    id: 'writing',
    title: '写文案 / 内容创作',
    description: '文章、脚本、营销文案等写作任务。',
    taskPrompt: '我要完成一段内容创作，请判断这次优先用哪个写作类工具。',
  },
  {
    id: 'design_assets',
    title: '做图或设计素材',
    description: '海报、产品图、视觉草稿等设计产出。',
    taskPrompt: '我要做视觉或设计素材，请判断这次先试哪个设计工具。',
  },
  {
    id: 'data_analytics',
    title: '数据分析或报表',
    description: '表格分析、可视化、业务洞察。',
    taskPrompt: '我要做数据分析或报表，请推荐这次最值得先试的工具。',
  },
  {
    id: 'workflow_automation',
    title: '重复流程自动化',
    description: '把多步手工流程串起来自动跑。',
    taskPrompt: '我想把重复流程自动化，请判断这次适合从哪个工具开始。',
  },
  {
    id: 'video_audio',
    title: '视频或音频处理',
    description: '剪辑、转写、配音、格式转换等。',
    taskPrompt: '我有视频或音频处理需求，请判断这次先试哪个工具。',
  },
  {
    id: 'support_email',
    title: '客服 / 邮件效率',
    description: '回复客户、处理工单、邮件跟进。',
    taskPrompt: '我要提升客服或邮件处理效率，请推荐这次优先试的工具。',
  },
  {
    id: 'knowledge_learning',
    title: '学习笔记与知识管理',
    description: '读书笔记、知识库、检索复习。',
    taskPrompt: '我要整理学习笔记或知识库，请判断这次先试哪个工具。',
  },
]

export const STARTER_PROMPT_TEMPLATES: StarterPromptTemplate[] = [
  {
    id: 'research-table',
    title: '资料整理',
    description: '角色、输出格式和可追溯要求都说清楚。',
    prompt:
      '我是运营，想找一个工具帮我整理竞品资料，要求中文友好、能导出表格，并且最好带来源引用。',
  },
  {
    id: 'automation-api',
    title: '自动化接入',
    description: '适合需要 API、流程串联或工程落地的任务。',
    prompt:
      '我是开发，想找一个可以接入 API 的工具，把重复流程自动化，要求文档清楚、稳定、方便集成。',
  },
  {
    id: 'quick-office',
    title: '轻量办公',
    description: '适合快速处理文件、图片或低摩擦小任务。',
    prompt: '我是个人用户，想快速处理 PDF 或图片，最好免费、不用注册、中文体验好，能马上开始用。',
  },
]

const MIN_CUSTOM_TASK_LENGTH = 4
const COLD_START_TASK_PATTERN = /任务：(.+)/
const STARTER_ROLE_IDS = new Set<StarterRoleId>(STARTER_ROLES.map((role) => role.id))
const STARTER_OUTCOME_IDS = new Set<StarterOutcomeId>(STARTER_OUTCOMES.map((outcome) => outcome.id))
const STARTER_CONSTRAINT_IDS = new Set<StarterConstraintId>(
  STARTER_CONSTRAINTS.map((constraint) => constraint.id),
)

export function getStarterOutcomeById(id: StarterOutcomeId): StarterOutcome | undefined {
  return STARTER_OUTCOMES.find((outcome) => outcome.id === id)
}

export function extractColdStartTaskLine(text: string): string {
  const match = text.match(COLD_START_TASK_PATTERN)
  return match?.[1]?.trim() ?? text.trim()
}

export function resolveStarterTaskText(intake: StarterIntake): string {
  const custom = intake.customTask.trim()
  if (custom.length >= MIN_CUSTOM_TASK_LENGTH) return custom
  if (intake.outcomeId) {
    return getStarterOutcomeById(intake.outcomeId)?.taskPrompt ?? ''
  }
  return ''
}

export function resolveStarterDisplayGoal(intake: StarterIntake): string {
  return resolveStarterTaskText(intake)
}

export function canStartStructuredAnalysis(intake: StarterIntake): boolean {
  return resolveStarterTaskText(intake).length >= MIN_CUSTOM_TASK_LENGTH
}

export function canStartStarterAnalysis(intake: StarterIntake): boolean {
  return canStartStructuredAnalysis(intake)
}

export function composeStarterPrompt(intake: StarterIntake): string {
  const roleLabel = STARTER_ROLES.find((role) => role.id === intake.roleId)?.label ?? '未指定'
  const constraintLabels = STARTER_CONSTRAINTS.filter((item) =>
    intake.constraintIds.includes(item.id),
  ).map((item) => item.label)
  const constraintsLine = constraintLabels.length > 0 ? constraintLabels.join('、') : '无特别约束'
  const taskLine = resolveStarterTaskText(intake)

  return [
    '【冷启动】',
    `身份：${roleLabel}`,
    `约束：${constraintsLine}`,
    `任务：${taskLine}`,
    '',
    '请根据以上信息，判断这次最值得先试的工具或路径，并说明理由与下一步。',
  ].join('\n')
}

function includesAny(text: string, keywords: string[]): boolean {
  return keywords.some((keyword) => text.includes(keyword))
}

function inferRoleId(text: string): StarterRoleId | null {
  if (includesAny(text, ['创始', '老板', '负责人', '创业', '公司'])) return 'founder'
  if (includesAny(text, ['市场', '运营', '增长', '投放', '社媒', '营销'])) return 'marketer'
  if (includesAny(text, ['开发', '代码', '程序', '接口', 'api', 'API', '工程'])) return 'developer'
  if (includesAny(text, ['设计', '海报', '视觉', '图片', '产品图', '素材'])) return 'designer'
  if (includesAny(text, ['销售', '客户', '线索', '成交'])) return 'sales'
  if (includesAny(text, ['招聘', '人力', '候选人', '简历'])) return 'hr'
  if (includesAny(text, ['财务', '报销', '预算', '发票'])) return 'finance'
  if (includesAny(text, ['流程', '协作', '自动化', '工单'])) return 'operations'
  return null
}

function inferOutcomeId(text: string): StarterOutcomeId | null {
  if (includesAny(text, ['资料', '引用', '来源', '调研', '搜索', '查找', '竞品']))
    return 'research_citations'
  if (includesAny(text, ['整理', '总结', '摘要', '会议纪要', '结构化'])) return 'structure_content'
  if (includesAny(text, ['PDF', 'pdf', '翻译', '压缩', '去背景', '格式转换'])) return 'office_tools'
  if (includesAny(text, ['文案', '文章', '脚本', '小红书', '公众号', '邮件'])) return 'writing'
  if (includesAny(text, ['做图', '海报', '设计', '视觉', '产品图', '图片'])) return 'design_assets'
  if (includesAny(text, ['数据', '表格', '报表', '分析', '可视化'])) return 'data_analytics'
  if (includesAny(text, ['自动化', '重复', '批量', '流程', '连接'])) return 'workflow_automation'
  if (includesAny(text, ['视频', '音频', '剪辑', '转写', '配音'])) return 'video_audio'
  if (includesAny(text, ['客服', '客户回复', '工单', '邮件回复'])) return 'support_email'
  if (includesAny(text, ['学习', '笔记', '知识库', '复习', '读书'])) return 'knowledge_learning'
  return null
}

function inferConstraintIds(text: string): StarterConstraintId[] {
  const constraints: StarterConstraintId[] = []
  const add = (id: StarterConstraintId) => {
    if (!constraints.includes(id)) constraints.push(id)
  }

  if (includesAny(text, ['个人', '自己', '独立', '一个人'])) add('solo')
  if (includesAny(text, ['小团队', '团队'])) add('small_team')
  if (includesAny(text, ['企业', '公司内部', '权限'])) add('enterprise')
  if (includesAny(text, ['免费', '不要钱', '低成本'])) add('free_first')
  if (includesAny(text, ['订阅', '付费'])) add('subscription_ok')
  if (includesAny(text, ['无广告', '不要广告'])) add('no_ads')
  if (includesAny(text, ['隐私', '敏感', '保密'])) add('privacy_sensitive')
  if (includesAny(text, ['免注册', '不用登录', '不登录'])) add('no_signup')
  if (includesAny(text, ['来源', '引用', '可追溯', '可核验'])) add('citations')
  if (includesAny(text, ['快', '马上', '立刻', '简单', '上手'])) add('fast_start')
  if (includesAny(text, ['中文', '国内'])) add('chinese')
  if (includesAny(text, ['API', 'api', '接口', '集成'])) add('api_needed')
  if (includesAny(text, ['手机', '移动端'])) add('mobile_first')

  return constraints
}

export function inferStarterIntakeFromText(text: string): StarterIntakeDraft {
  const sourceText = text.trim()
  return {
    roleId: inferRoleId(sourceText),
    outcomeId: inferOutcomeId(sourceText),
    customTask: sourceText,
    constraintIds: inferConstraintIds(sourceText),
    sourceText,
    source: 'fallback',
  }
}

function normalizeString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeConfidenceValue(value: unknown): number | undefined {
  if (typeof value !== 'number' || !Number.isFinite(value)) return undefined
  return Math.max(0, Math.min(1, value))
}

function normalizeStringArray(value: unknown, limit: number): string[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => normalizeString(item))
    .filter(Boolean)
    .slice(0, limit)
}

function extractJsonObject(text: string): string {
  const trimmed = text.trim()
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) return trimmed
  const start = trimmed.indexOf('{')
  const end = trimmed.lastIndexOf('}')
  if (start < 0 || end <= start) {
    throw new Error('intent response did not include a JSON object')
  }
  return trimmed.slice(start, end + 1)
}

export function normalizeStarterIntakeDraft(
  value: unknown,
  sourceText: string,
  source: StarterIntakeDraft['source'] = 'model',
): StarterIntakeDraft {
  const record = value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
  const roleId = normalizeString(record.roleId)
  const outcomeId = normalizeString(record.outcomeId)
  const constraintIds = Array.isArray(record.constraintIds)
    ? record.constraintIds
        .map((item) => normalizeString(item))
        .filter((id): id is StarterConstraintId =>
          STARTER_CONSTRAINT_IDS.has(id as StarterConstraintId),
        )
    : []
  const confidenceRecord =
    record.confidence && typeof record.confidence === 'object'
      ? (record.confidence as Record<string, unknown>)
      : {}
  const confidence: StarterIntakeDraft['confidence'] = {}
  const roleConfidence = normalizeConfidenceValue(confidenceRecord.role)
  const goalConfidence = normalizeConfidenceValue(confidenceRecord.goal)
  const constraintsConfidence = normalizeConfidenceValue(confidenceRecord.constraints)

  if (roleConfidence != null) confidence.role = roleConfidence
  if (goalConfidence != null) confidence.goal = goalConfidence
  if (constraintsConfidence != null) confidence.constraints = constraintsConfidence

  const safeSourceText = sourceText.trim()
  const customTask = normalizeString(record.customTask) || safeSourceText

  return {
    roleId: STARTER_ROLE_IDS.has(roleId as StarterRoleId) ? (roleId as StarterRoleId) : null,
    outcomeId: STARTER_OUTCOME_IDS.has(outcomeId as StarterOutcomeId)
      ? (outcomeId as StarterOutcomeId)
      : null,
    customTask,
    constraintIds: [...new Set(constraintIds)],
    sourceText: normalizeString(record.sourceText) || safeSourceText,
    missingInputs: normalizeStringArray(record.missingInputs, 3),
    confidence: Object.keys(confidence).length > 0 ? confidence : undefined,
    reasoningSummary: normalizeString(record.reasoningSummary) || undefined,
    source,
  }
}

export function parseStarterIntakeDraftJson(
  text: string,
  sourceText: string,
  source: StarterIntakeDraft['source'] = 'model',
): StarterIntakeDraft {
  const json = extractJsonObject(text)
  return normalizeStarterIntakeDraft(JSON.parse(json) as unknown, sourceText, source)
}

export function createEmptyStarterIntake(): StarterIntake {
  return {
    roleId: null,
    outcomeId: null,
    customTask: '',
    constraintIds: [],
  }
}
