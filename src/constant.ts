export const QWEN_MODEL = 'qwen-plus'
export const QWEN_BASE_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1'

export const SUPABASE_STORAGE_BUCKET_MARKET = 'dorapocket-market-assets'

export const ALIYUN_NLS_STT_WS_URL = 'wss://nls-gateway-cn-shanghai.aliyuncs.com/ws/v1'
export const ALIYUN_TTS_VOICE = 'zhitian_emo'

const SITE_URL_DEVELOPMENT = 'http://localhost:3000'
const SITE_URL_PRODUCTION = 'https://dorapocket.nirvazure.cn'

export function getSiteUrl(): string {
  return process.env.NODE_ENV === 'development' ? SITE_URL_DEVELOPMENT : SITE_URL_PRODUCTION
}
