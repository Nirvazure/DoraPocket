import { NextResponse } from 'next/server'
import { listActiveToolItems } from '@/server/market/tool-catalog'
import { searchActiveTools } from '@/server/market/tool-search'
import { verifySession } from '@/server/auth/dal'
import { getUserSettings } from '@/server/repositories/user-settings-repo'
import { normalizeMarketSearchQuery } from '@/shared/market-search-query'

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
    let builtinToolsEnabled = false

    try {
      const session = await verifySession()
      if (session?.user) {
        builtinToolsEnabled = (await getUserSettings(session.user.id)).builtinToolsEnabled
      }
    } catch (error) {
      console.warn('[market/tools] Falling back to builtin tools disabled', error)
    }

    const { searchParams } = new URL(request.url)
    const rawQuery = searchParams.get('q') ?? ''
    const query = normalizeMarketSearchQuery(rawQuery)

    if (!query) {
      return NextResponse.json(await listActiveToolItems(builtinToolsEnabled))
    }

    try {
      return NextResponse.json(await searchActiveTools(query, builtinToolsEnabled))
    } catch (error) {
      console.error('[market/tools] FTS search failed, falling back to full list', error)
      const all = await listActiveToolItems(builtinToolsEnabled)
      return NextResponse.json(filterToolsByQueryFallback(all, query))
    }
  } catch (error) {
    console.error('[market/tools] Failed to list active tools', error)
    return NextResponse.json({ message: 'Failed to list market tools' }, { status: 500 })
  }
}
