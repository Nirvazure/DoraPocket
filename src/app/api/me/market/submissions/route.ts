import { NextResponse } from 'next/server'
import { verifySession } from '@/server/auth/dal'
import { listMarketSubmissions } from '@/server/repositories/market-submission-repo'

export async function GET() {
  const session = await verifySession()
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  return NextResponse.json(await listMarketSubmissions(session.user.id))
}
