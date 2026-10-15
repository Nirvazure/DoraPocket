import { NextResponse } from 'next/server'
import { verifySession } from '@/server/auth/dal'

export async function POST() {
  const session = await verifySession()
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  return NextResponse.json({ message: '旧版本地数据导入已停用。' }, { status: 410 })
}
