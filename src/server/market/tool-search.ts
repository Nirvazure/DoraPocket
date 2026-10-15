import 'server-only'

import { prisma } from '@/server/db/prisma'
import { getExtensionSchema } from '@/server/db/extensions'
import { mapDbToolToToolItem } from '@/server/market/tool-catalog'
import {
  normalizeMarketSearchQuery,
  resolveCategoryKeysMatchingQuery,
  toIlikePattern,
} from '@/shared/market/market-search-query'

const SEARCH_LIMIT = 200

export async function searchActiveTools(rawQuery: string, viewerUserId?: string | null) {
  const query = normalizeMarketSearchQuery(rawQuery)
  if (!query) throw new Error('searchActiveTools requires normalized query length >= 2')
  const schema = await getExtensionSchema('pg_trgm')
  const rows = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
    `SELECT t."id" FROM dorapocket."Tool" t LEFT JOIN dorapocket."ToolIndex" i ON i."toolId" = t."id"
     WHERE t."status" = 'active' AND (
       i."searchDocument" @@ pg_catalog.plainto_tsquery('pg_catalog.simple', $1)
       OR t."name" ILIKE $2 ESCAPE '\\'
       OR t."description" ILIKE $2 ESCAPE '\\'
       OR EXISTS (SELECT 1 FROM unnest(t."tags") AS tag WHERE tag ILIKE $2 ESCAPE '\\')
       OR t."category" = ANY($3::text[]))
     ORDER BY COALESCE(pg_catalog.ts_rank(i."searchDocument", pg_catalog.plainto_tsquery('pg_catalog.simple', $1)), 0) DESC,
       ${schema}.similarity(t."name", $1) DESC, t."id" ASC LIMIT $4`,
    query,
    toIlikePattern(query),
    resolveCategoryKeysMatchingQuery(query),
    SEARCH_LIMIT,
  )
  const tools = await prisma.tool.findMany({
    where: { id: { in: rows.map((row) => row.id) } },
    include: {
      marketFeedback: { select: { vote: true } },
      toolActivities: { select: { saves: true, opens: true } },
    },
  })
  const byId = new Map(tools.map((tool) => [tool.id, tool]))
  return rows.flatMap(({ id }) => {
    const tool = byId.get(id)
    return tool ? [mapDbToolToToolItem(tool, viewerUserId)] : []
  })
}
