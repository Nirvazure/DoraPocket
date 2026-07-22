import { NextResponse } from 'next/server'
import { getCurrentUserOrNull } from '@/server/auth/dal'
import { prisma } from '@/server/db/prisma'
import { mapDbToolToToolItem } from '@/server/market/tool-catalog'

export const dynamic = 'force-dynamic'

const MAX_BATCH_IDS = 50

function parseIds(searchParams: URLSearchParams): string[] {
  const raw = searchParams.get('ids') ?? ''
  const ids = raw
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean)
  return [...new Set(ids)].slice(0, MAX_BATCH_IDS)
}

export async function GET(request: Request) {
  try {
    const viewer = await getCurrentUserOrNull()
    const viewerUserId = viewer?.id ?? null
    const ids = parseIds(new URL(request.url).searchParams)
    if (ids.length === 0) {
      return NextResponse.json([])
    }

    const tools = await prisma.tool.findMany({
      where: { id: { in: ids }, status: 'active' },
    })

    const byId = new Map(tools.map((tool) => [tool.id, mapDbToolToToolItem(tool, viewerUserId)]))
    const ordered = ids
      .map((id) => byId.get(id))
      .filter((item): item is NonNullable<typeof item> => item != null)

    return NextResponse.json(ordered, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('[market/tools/batch] Failed to load tools', error)
    return NextResponse.json({ message: 'Failed to load market tools' }, { status: 500 })
  }
}
