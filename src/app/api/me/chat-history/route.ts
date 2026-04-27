import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/server/auth/dal'
import {
  clearChatHistory,
  createChatHistoryEntry,
  listChatHistory,
} from '@/server/repositories/chat-history-repo'

export async function GET() {
  const session = await verifySession()
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  return NextResponse.json(await listChatHistory(session.user.id))
}

export async function POST(request: NextRequest) {
  const session = await verifySession()
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const body = (await request.json()) as {
    userText: string
    assistantText: string
    selectedToolId?: string
  }
  return NextResponse.json(await createChatHistoryEntry(session.user.id, body))
}

export async function DELETE() {
  const session = await verifySession()
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  await clearChatHistory(session.user.id)
  return NextResponse.json([])
}
