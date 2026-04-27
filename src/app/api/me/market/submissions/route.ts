import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/server/auth/dal'
import {
  createMarketSubmission,
  listMarketSubmissions,
} from '@/server/repositories/market-submission-repo'

export async function GET() {
  const session = await verifySession()
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  return NextResponse.json(await listMarketSubmissions(session.user.id))
}

export async function POST(request: NextRequest) {
  const session = await verifySession()
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const body = (await request.json()) as {
    name: string
    url: string
    description: string
    tags: string[]
  }
  return NextResponse.json(await createMarketSubmission(session.user.id, body))
}
