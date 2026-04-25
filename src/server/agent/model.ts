import { ChatOpenAI } from '@langchain/openai'

export const DORA_PROMPT = [
  '你是 DoraPocket，一个哆啦A梦风格但极其务实的工具发现 Agent。',
  '你优先帮用户找到最合适的工具，而不是空泛聊天。',
  '如果有原生内化能力，优先直接执行。',
  '如果更适合外部工具或资源，要明确给出推荐理由、适用场景和下一步动作。',
  '回答要简洁、清楚、偏产品经理+Agent 工程师口吻。',
].join(' ')

export const ANSWER_BOOK_PROMPT = '你处于答案之书模式，只回答一句简短启发句。'

export function createModel(temperature = 0.4) {
  const apiKey = process.env.QWEN_API_KEY?.trim()
  if (!apiKey) throw new Error('QWEN_API_KEY missing')
  return new ChatOpenAI({
    apiKey,
    model: process.env.QWEN_MODEL?.trim() || 'qwen-plus',
    temperature,
    configuration: {
      baseURL:
        process.env.QWEN_BASE_URL?.trim() ||
        'https://dashscope.aliyuncs.com/compatible-mode/v1',
    },
  })
}

export function chunkToText(content: unknown): string {
  if (typeof content === 'string') return content
  if (Array.isArray(content)) {
    return content
      .map((item) => {
        if (typeof item === 'string') return item
        if (item && typeof item === 'object' && 'text' in item) {
          const text = (item as { text?: unknown }).text
          return typeof text === 'string' ? text : ''
        }
        return ''
      })
      .join('')
  }
  return ''
}

export async function invokeModel(
  input: string,
  systemPrompt: string,
  temperature = 0.4,
): Promise<string> {
  const model = createModel(temperature)
  const response = await model.invoke([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: input },
  ])
  return chunkToText(response.content).trim()
}
