import { NextResponse } from 'next/server'
import { ALIYUN_NLS_STT_WS_URL } from '@/constant'
import { fetchNlsToken } from '@/server/aliyun/token'

export async function GET() {
  try {
    const akId = process.env.ALIYUN_AK_ID?.trim() || ''
    const akSecret = process.env.ALIYUN_AK_SECRET?.trim() || ''
    const appkey = process.env.ALIYUN_NLS_APPKEY?.trim() || ''
    if (!akId || !akSecret || !appkey) {
      return NextResponse.json({ error: 'Aliyun env missing' }, { status: 503 })
    }
    const token = await fetchNlsToken(akId, akSecret)
    return NextResponse.json({
      token,
      appkey,
      wsUrl: ALIYUN_NLS_STT_WS_URL,
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
