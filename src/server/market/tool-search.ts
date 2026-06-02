import 'server-only'

import type { ToolModel as DbTool } from '../../generated/prisma/models/Tool'
import { prisma } from '@/server/db/prisma'
import { mapDbToolToToolItem } from '@/server/market/tool-catalog'
import {
  normalizeMarketSearchQuery,
  resolveCategoryKeysMatchingQuery,
  toIlikePattern,
} from '@/shared/market-search-query'

const SEARCH_LIMIT = 200

export async function searchActiveTools(rawQuery: string) {
  const query = normalizeMarketSearchQuery(rawQuery)
  if (!query) {
    throw new Error('searchActiveTools requires normalized query length >= 2')
  }

  const ilike = toIlikePattern(query)
  const categoryKeys = resolveCategoryKeysMatchingQuery(query)
  const categoryClause = categoryKeys.length > 0 ? `OR "category" = ANY($3::text[])` : ''
  const params: unknown[] = [query, ilike]
  if (categoryKeys.length > 0) params.push(categoryKeys)

  const rows = await prisma.$queryRawUnsafe<DbTool[]>(
    `SELECT *
     FROM "Tool"
     WHERE "status" = 'active'
       AND (
         "searchDocument" @@ plainto_tsquery('simple', $1)
         OR "name" ILIKE $2 ESCAPE '\\'
         OR "description" ILIKE $2 ESCAPE '\\'
         OR EXISTS (
           SELECT 1 FROM unnest("tags") AS tag WHERE tag ILIKE $2 ESCAPE '\\'
         )
         ${categoryClause}
       )
     ORDER BY
       ts_rank("searchDocument", plainto_tsquery('simple', $1)) DESC,
       similarity("name", $1) DESC
     LIMIT ${SEARCH_LIMIT}`,
    ...params,
  )

  return rows.map(mapDbToolToToolItem)
}
