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
    reviewAction: '补充体验',
    reviewSupplementScore: '补充评分',
    updateReviewAction: '更新体验',
    builtinSection: '内置工具',
    reviewDrawerTitle: '这次这个工具好用吗？',
    reviewDrawerSubtitle: '告诉 DoraPocket 它为什么适合，或者为什么不适合，下次会更会出手。',
    reviewVoteTitle: '整体态度',
    reviewStarTitle: '这次打几分',
    reviewTagsTitle: '它最像什么体验',
    reviewSubmitAction: '记录这次体验',
    reviewSavedNotice: '已记住这次体验',
    reviewCountLabel: '条体验',
    reviewEmptyLabel: '暂无体验评分',
    voteOptions: {
      up: '值得继续拿给我',
      down: '下次别先拿这个',
    },
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
  settings: {
    title: 'DoraPocket - 设置',
    subtitle: '决定 DoraPocket 如何陪你、替你记住，以及怎样更少打扰地出手。',
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

export const SETTINGS_COPY = {
  title: 'DoraPocket - 设置',
  subtitle: '决定 DoraPocket 如何陪你、替你记住，以及怎样更少打扰地出手。',
  heading: '设置',
  description:
    '这里不处理“你偏好什么帮助”，而是处理“系统该怎样陪你、什么时候开口、替你记住什么，以及怎样把结论呈现得更顺手”。',
  sections: {
    companion: {
      title: '陪伴方式',
      description: '让 DoraPocket 更像安静陪伴，而不是一直打断你。',
    },
    memory: {
      title: '记住什么',
      description: '决定系统替你记住什么，和下次是否更省事。',
    },
    presentation: {
      title: '怎么呈现',
      description: '让结论更直接，或保留更多理由与阅读舒适度。',
    },
    reset: {
      title: '重置与清理',
      description: '当你想重新开始时，保留控制权。',
    },
  },
  items: {
    voicePlayback: {
      title: '语音播报',
      description: '让 DoraPocket 在结果返回后用声音补一句，还是保持安静。',
    },
    voicePlaybackMode: {
      title: '播报时机',
      description: '决定它是只在关键结论时开口，还是完整播报回复。',
      options: [
        { value: 'off', label: '保持安静' },
        { value: 'key-result', label: '只播关键结论' },
        { value: 'full', label: '完整播报' },
      ],
    },
    autoSave: {
      title: '自动沉淀进口袋',
      description: '当系统判断这次帮助值得再用时，是否替你先收好。',
    },
    memory: {
      title: '记录历史以优化推荐',
      description: '允许系统记住你过去怎么选，减少下次重复判断。',
    },
    explanationMode: {
      title: '推荐解释详细度',
      description: '更直接给结果，或保留更多为什么。',
      options: [
        { value: 'brief', label: '更直接' },
        { value: 'standard', label: '保留理由' },
      ],
    },
    fontPreset: {
      title: '阅读字体风格',
      description: '调整全站阅读气质，让信息更贴近你的浏览习惯。',
      options: [
        { value: 'a', label: '稳重' },
        { value: 'b', label: '利落' },
        { value: 'c', label: '轻快' },
        { value: 'd', label: '圆润' },
      ],
    },
  },
  actions: {
    resetPreferenceTitle: '重置推荐画像',
    resetPreferenceDescription: '清空显式校准，让系统回到重新理解你的状态。',
    resetPreferenceAction: '重置画像',
    clearHistoryTitle: '清空对话历史',
    clearHistoryDescription: '删除已保存的对话过程，但不会影响你的口袋资产。',
    clearHistoryAction: '清空历史',
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
  reviewUp: '补充了好评体验',
  reviewDown: '补充了不适合反馈',
  subscribed: '订阅了工具',
  unsubscribed: '取消了订阅',
  submitted: '提交了市场工具',
  reviewTags: {
    fast_to_start: '上手快',
    great_result: '结果好',
    chinese_friendly: '中文友好',
    no_login: '不用登录',
    beginner_friendly: '适合新手',
    time_saving: '省时间',
    worth_saving: '值得收入口袋',
    too_complex: '太复杂',
    needs_login: '要登录',
    too_expensive: '太贵',
    average_result: '结果一般',
    unstable: '不够稳定',
    not_for_this_task: '不适合这次任务',
    high_learning_cost: '学习成本高',
  },
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
