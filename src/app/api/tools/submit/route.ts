import { NextResponse } from 'next/server'
import { verifySession } from '@/server/auth/dal'
import { createMarketSubmission } from '@/server/repositories/market-submission-repo'
import { upsertImportedTool } from '@/server/repositories/tool-repo'

type ToolSubmitBody = {
  name?: string
  url?: string
  description?: string
  tags?: string[]
}

function normalizeToolUrl(value: string): string | null {
  try {
    const url = new URL(value.trim())
    if (!['http:', 'https:'].includes(url.protocol)) return null
    url.hash = ''
    return url.toString()
  } catch {
    return null
  }
}

export async function POST(request: Request) {
  const session = await verifySession()
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const body = (await request.json()) as ToolSubmitBody
  const name = body.name?.trim()
  const url = body.url ? normalizeToolUrl(body.url) : null
  const description = body.description?.trim()
  const tags = (body.tags ?? []).map((tag) => tag.trim()).filter(Boolean)

  if (!name || !url || !description) {
    return NextResponse.json({ message: 'name, url and description are required' }, { status: 400 })
  }

  await upsertImportedTool({
    name,
    url,
    description,
    category: 'productivity',
    tags: tags.length > 0 ? tags : ['用户提交'],
    capabilities: tags.length > 0 ? tags : ['工具推荐'],
    recommendedFor: [`需要${name}相关能力`],
    sourceNote: '用户提交到 Tool Hub',
    createdByUserId: session.user.id,
  })

  return NextResponse.json(
    await createMarketSubmission(session.user.id, {
      name,
      url,
      description,
      tags,
    }),
  )
}
