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

export type StarterWizardStep = 1 | 2 | 3

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

const MIN_CUSTOM_TASK_LENGTH = 4
const COLD_START_TASK_PATTERN = /任务：(.+)/

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

export function canAdvanceStarterStep(intake: StarterIntake, step: StarterWizardStep): boolean {
  switch (step) {
    case 1:
      return true
    case 2:
      return canStartStructuredAnalysis(intake)
    case 3:
      return true
    default:
      return false
  }
}

export function composeStarterPromptFromVoice(intake: StarterIntake, voiceText: string): string {
  return composeStarterPrompt({
    ...intake,
    outcomeId: null,
    customTask: voiceText.trim(),
  })
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

export function createEmptyStarterIntake(): StarterIntake {
  return {
    roleId: null,
    outcomeId: null,
    customTask: '',
    constraintIds: [],
  }
}
