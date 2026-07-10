import { invokeModel } from '@/server/agent/model'
import {
  inferStarterIntakeFromText,
  parseStarterIntakeDraftJson,
  type StarterIntakeDraft,
} from '@/shared/discovery/starter-intake'

type IntentRequestBody = {
  text?: string
}

type IntentResponseBody = {
  draft: StarterIntakeDraft
  source: 'model' | 'fallback'
  warning?: string
}

const INTENT_SYSTEM_PROMPT = [
  '你是 DoraPocket 的意图理解模块，只负责把用户的自然语言需求拆成结构化 JSON。',
  '只输出 JSON，不要 Markdown，不要解释。',
  '字段必须包含：roleId、outcomeId、customTask、constraintIds、sourceText。',
  '可选字段：missingInputs、confidence、reasoningSummary。',
  'roleId 只能是 founder、marketer、developer、designer、sales、hr、finance、operations、other 或 null。',
  'outcomeId 只能是 research_citations、structure_content、office_tools、writing、design_assets、data_analytics、workflow_automation、video_audio、support_email、knowledge_learning 或 null。',
  'constraintIds 只能使用 solo、small_team、mid_team、enterprise、free_first、subscription_ok、pay_as_you_go、enterprise_budget、no_ads、ads_acceptable、privacy_sensitive、no_signup、citations、fast_start、chinese、api_needed、mobile_first。',
  'customTask 用一句清楚的话保留用户真正要完成的目标，不要变成推荐结论。',
  'confidence 的 role、goal、constraints 是 0 到 1 的数字。',
].join('\n')

function responseJson(body: IntentResponseBody, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  })
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as IntentRequestBody
  const text = body.text?.trim()

  if (!text) {
    return new Response(JSON.stringify({ error: 'text is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    })
  }

  try {
    const modelText = await invokeModel(text, INTENT_SYSTEM_PROMPT, 0.1)
    const draft = parseStarterIntakeDraftJson(modelText, text, 'model')
    return responseJson({ draft, source: 'model' })
  } catch (error) {
    const draft = inferStarterIntakeFromText(text)
    return responseJson({
      draft,
      source: 'fallback',
      warning: error instanceof Error ? error.message : String(error),
    })
  }
}
