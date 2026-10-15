import { NextResponse } from 'next/server'
import { verifySession } from '@/server/auth/dal'

export async function GET() {
  const session = await verifySession()
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  return NextResponse.json({ message: '工具订阅功能已移除。' }, { status: 410 })
}

export async function POST() {
  const session = await verifySession()
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  return NextResponse.json({ message: '工具订阅功能已移除。' }, { status: 410 })
}
