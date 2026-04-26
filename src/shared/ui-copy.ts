export const PAGE_COPY = {
  analysis: {
    title: 'DoraPocket - 分析页',
    subtitle: '不只是聊天，而是替你找到全网更合适的帮助，并把高价值能力沉淀进口袋。',
    promptSuggestion: '帮我找一个最好用的 PDF 压缩工具',
    promptPlaceholder: '试试：帮我找一个最好用的 PDF 压缩工具',
  },
  market: {
    title: 'DoraPocket - 市场页',
    subtitle: '按类别浏览原生能力与优质工具，不让市场变成无结论的工具海。',
    searchPlaceholder: '搜索工具、能力、标签或类别…',
    submitAction: '提交工具',
    collectAction: '收入口袋',
    openAction: '打开',
    builtinSection: '内置工具',
    stats: {
      recommendation: '推荐',
      opens: '打开',
      nativeCard: '站内小闭环',
      externalLink: '外部打开',
    },
  },
  profile: {
    title: 'DoraPocket - 个人中心',
    subtitle: '管理头像、偏好、历史与回流信号，让系统更懂你。',
  },
  pocket: {
    title: 'DoraPocket - 我的口袋',
    subtitle: '把你从市场里挑中的工具收进来，沉淀成自己的可复用入口。',
    searchPlaceholder: '搜索我收藏的工具…',
    emptyTitle: '你的工具收藏夹还是空的',
    emptyDescription: '先去市场看看，把你想留着以后再用的工具收进来。',
    goMarketAction: '去市场收藏工具',
    backToAnalysisAction: '回分析页调用',
    unpinAction: '取消置顶',
    pinAction: '置顶',
    unmarkPurchasedAction: '取消已购',
    markPurchasedAction: '标记已购',
    archiveAction: '归档',
    unarchiveAction: '取消归档',
    removeAction: '移出收藏',
    deleteAction: '删除',
    pinnedBadge: '已置顶',
    purchasedBadge: '已购买',
    pinnedSection: '置顶',
    collectionSection: '全部收藏',
    archivedSection: '归档',
    noSearchResult: '没有找到匹配当前搜索的收藏工具。',
  },
} as const

export const SYSTEM_NOTICE_COPY = {
  autoSaved: '已沉淀为可复用入口',
  savedForLater: '已沉淀为下次可复用入口',
  analysisFailed: '分析失败，请稍后重试',
} as const

export const VOICE_COPY = {
  started: '语音辅助输入已开启',
  emptyTranscript: '未收到识别文本。你可以直接用底部输入框发送文字。',
  timeout: '监听超时，已自动结束。你也可以直接使用文字输入。',
  errors: {
    network: '语音识别依赖浏览器在线服务，网络异常时请改用文字输入。',
    'no-speech': '没有听清语音，请靠近麦克风后再试。',
    'not-allowed': '麦克风权限未开启，请在浏览器地址栏授权。',
    aborted: '语音识别已中断。',
    'audio-capture': '无法访问麦克风，可能被其他应用占用。',
    'service-not-allowed': '系统或浏览器禁用了语音识别服务。',
    'start-failed': '无法启动语音识别，请稍后重试或改用文字输入。',
  },
  fallbackErrorPrefix: '语音识别错误：',
} as const

export const PROFILE_COPY = {
  summaryFallback: '偏好画像还在建立中，先通过收藏、复用和反馈积累真实信号。',
  factLabels: {
    preferredCategory: '偏好分类',
    preferredPlatform: '偏好平台',
    preferredPricing: '价格倾向',
    subscribedAssets: '订阅资产',
    pending: '待学习',
  },
} as const

export const MARKET_ACTIVITY_COPY = {
  feedbackUp: '投了好票',
  feedbackDown: '投了不合适',
  subscribed: '订阅了工具',
  unsubscribed: '取消了订阅',
  submitted: '提交了市场工具',
  summaries: {
    preferredCategoriesPrefix: '偏好',
    preferredCategoriesSuffix: '类工具',
    savedTagsPrefix: '常收藏',
    savedTagsSuffix: '相关能力',
    avoidAuthWall: '更偏好免登录、低摩擦工具',
    lowTrialCost: '对低试错成本工具更敏感',
    prefersSubscriptionTools: '愿意把工具沉淀成长线订阅资产',
  },
} as const
