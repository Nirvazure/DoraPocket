import { useEffect } from 'react'
import { CheckCircle2, ExternalLink, FolderPlus, Sparkles, Zap } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  TOOL_ID_AIR_QUALITY,
  TOOL_ID_EXCHANGE,
  TOOL_ID_TIME,
  TOOL_ID_WEATHER,
  TOOL_ID_WEB_SUMMARY,
  getToolById,
} from '@/services/tool-registry'

export type ToolRenderEvent =
  | { type: 'tool_rendered'; toolId: string; args?: Record<string, unknown> }
  | { type: 'tool_requires_input'; toolId: string; message: string }
  | { type: 'tool_completed'; toolId: string; payload?: Record<string, unknown> }

export type ToolDynamicRendererProps = {
  toolId: string | null | undefined
  args?: Record<string, unknown>
  onToolEvent?: (event: ToolRenderEvent) => void
}

type ToolCardViewModel = {
  title: string
  summary: string
  focusLabel: string
  followUp: string
  chips: string[]
}

function buildBuiltinViewModel(toolId: string, args?: Record<string, unknown>): ToolCardViewModel | null {
  if (toolId === TOOL_ID_WEATHER) {
    const location = typeof args?.location === 'string' && args.location.trim() ? args.location.trim() : '当前城市'
    return {
      title: '天气查询已就绪',
      summary: `已锁定查询地点：${location}`,
      focusLabel: '适合出门前快速判断天气',
      followUp: '可继续追问降雨、温度、穿衣或未来几天变化。',
      chips: ['原生执行', '即时可用', '适合保存地点'],
    }
  }

  if (toolId === TOOL_ID_TIME) {
    return {
      title: '时间查询已就绪',
      summary: '当前轮次命中内置时间能力',
      focusLabel: '适合确认当前时刻、星期或时区',
      followUp: '可继续追问其他地区时间、会议排期或倒计时。',
      chips: ['原生执行', '零参数', '可直接复用'],
    }
  }

  if (toolId === TOOL_ID_EXCHANGE) {
    const from = typeof args?.from === 'string' && args.from.trim() ? args.from.trim().toUpperCase() : 'USD'
    const to = typeof args?.to === 'string' && args.to.trim() ? args.to.trim().toUpperCase() : 'CNY'
    const amount = typeof args?.amount === 'number' && Number.isFinite(args.amount) ? args.amount : 1
    return {
      title: '汇率换算已就绪',
      summary: `换算参数：${amount} ${from} → ${to}`,
      focusLabel: '适合跨币种价格判断和报销预估',
      followUp: '可继续追问多币种对比、历史波动或批量换算。',
      chips: ['原生执行', '参数可沉淀', '适合重复调用'],
    }
  }

  if (toolId === TOOL_ID_AIR_QUALITY) {
    const location = typeof args?.location === 'string' && args.location.trim() ? args.location.trim() : '当前城市'
    return {
      title: '空气质量查询已就绪',
      summary: `已锁定查询地点：${location}`,
      focusLabel: '适合通勤前确认 AQI 与户外活动风险',
      followUp: '可继续追问 PM2.5、污染等级或是否适合跑步。',
      chips: ['原生执行', '适合订阅', '健康决策'],
    }
  }

  if (toolId === TOOL_ID_WEB_SUMMARY) {
    const url = typeof args?.url === 'string' && args.url.trim() ? args.url.trim() : '未提供网页链接'
    return {
      title: '网页摘要已就绪',
      summary: `目标链接：${url}`,
      focusLabel: '适合长文速读和资料沉淀',
      followUp: '可继续追问关键结论、结构提炼或可执行要点。',
      chips: ['原生执行', '资料入口', '适合保存链接'],
    }
  }

  return null
}

export function ToolDynamicRenderer({ toolId, args, onToolEvent }: ToolDynamicRendererProps) {
  useEffect(() => {
    if (!toolId) return
    onToolEvent?.({ type: 'tool_rendered', toolId, args })
    if (toolId === TOOL_ID_WEB_SUMMARY) {
      const url = typeof args?.url === 'string' ? args.url.trim() : ''
      if (!url) onToolEvent?.({ type: 'tool_requires_input', toolId, message: '网页摘要需要 URL 参数。' })
    }
  }, [toolId, args, onToolEvent])

  if (!toolId) return null
  const tool = getToolById(toolId)
  const builtinView = buildBuiltinViewModel(toolId, args)

  if (builtinView) {
    return (
      <Card className="rounded-2xl border border-primary/30 bg-white/92 shadow-sm backdrop-blur-sm">
        <CardHeader className="space-y-2 pb-2">
          <div className="flex items-center gap-2 text-[11px] font-semibold text-primary">
            <Zap className="h-3.5 w-3.5" />
            原生工具执行卡
          </div>
          <CardTitle className="text-sm font-semibold text-foreground">{builtinView.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-xs text-muted-foreground">
          <div className="rounded-2xl border border-border/60 bg-background/80 p-3">
            <p className="font-medium text-foreground">{builtinView.summary}</p>
            <p className="mt-1 leading-relaxed">{builtinView.focusLabel}</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {builtinView.chips.map((chip) => (
              <span key={chip} className="rounded-full border border-border/60 bg-background px-2 py-0.5">
                {chip}
              </span>
            ))}
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-3 text-emerald-900">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <p>{builtinView.followUp}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="rounded-2xl border border-primary/30 bg-white/92 shadow-sm backdrop-blur-sm">
      <CardHeader className="space-y-2 pb-2">
        <div className="flex items-center gap-2 text-[11px] font-semibold text-primary">
          <Sparkles className="h-3.5 w-3.5" />
          外部工具候选
        </div>
        <CardTitle className="text-sm font-semibold text-foreground">{tool?.name ?? '工具卡片'}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-xs text-muted-foreground">
        <div className="rounded-2xl border border-border/60 bg-background/80 p-3">
          <p className="leading-relaxed">{tool?.description ?? `工具 ID：${toolId}`}</p>
        </div>
        {tool ? (
          <>
            <div className="flex flex-wrap gap-1.5">
              <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background px-2 py-0.5">
                <FolderPlus className="h-3 w-3" />
                {tool.executionMode === 'native_card' ? '原生能力' : '市场工具'}
              </span>
              <span className="rounded-full border border-border/60 bg-background px-2 py-0.5">{tool.pricingModel}</span>
              <span className="rounded-full border border-border/60 bg-background px-2 py-0.5">{tool.platform}</span>
              {tool.url ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background px-2 py-0.5">
                  <ExternalLink className="h-3 w-3" />
                  可外跳使用
                </span>
              ) : null}
            </div>
            <div className="rounded-2xl border border-border/60 bg-background/80 p-3">
              <p className="font-medium text-foreground">推荐动作</p>
              <p className="mt-1 leading-relaxed">
                先判断是否值得收藏，再决定是否订阅；如果只是一次性使用，就直接外跳，不要把口袋堆成垃圾场。
              </p>
            </div>
          </>
        ) : null}
      </CardContent>
    </Card>
  )
}
