import { NextResponse } from 'next/server'
import { getCurrentUserOrNull } from '@/server/auth/dal'
import { listActiveToolItems } from '@/server/market/tool-catalog'
import { searchActiveTools } from '@/server/market/tool-search'
import { normalizeMarketSearchQuery } from '@/shared/market/market-search-query'

export const dynamic = 'force-dynamic'

function filterToolsByQueryFallback<
  T extends { name: string; description: string; tags: string[] },
>(tools: T[], query: string): T[] {
  const normalized = query.trim().toLowerCase()
  return tools.filter((tool) =>
    `${tool.name} ${tool.description} ${tool.tags.join(' ')}`.toLowerCase().includes(normalized),
  )
}

export async function GET(request: Request) {
  try {
    const viewer = await getCurrentUserOrNull()
    const viewerUserId = viewer?.id ?? null
    const { searchParams } = new URL(request.url)
    const rawQuery = searchParams.get('q') ?? ''
    const query = normalizeMarketSearchQuery(rawQuery)

    const headers = { 'Cache-Control': 'no-store' }

    if (!query) {
      return NextResponse.json(await listActiveToolItems(viewerUserId), { headers })
    }

    try {
      return NextResponse.json(await searchActiveTools(query, viewerUserId), { headers })
    } catch (error) {
      console.error('[market/tools] FTS search failed, falling back to full list', error)
      const all = await listActiveToolItems(viewerUserId)
      return NextResponse.json(filterToolsByQueryFallback(all, query), { headers })
    }
  } catch (error) {
    console.error('[market/tools] Failed to list active tools', error)
    return NextResponse.json({ message: 'Failed to list market tools' }, { status: 500 })
  }
}
