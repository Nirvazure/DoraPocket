import { listActiveToolItems } from '@/server/market/tool-catalog'
import { embedQuery, searchToolsByEmbedding } from '@/server/retrieval/tool-embedding'
import { rankToolItems, type ToolItem, type ToolMatch } from '@/shared/tool-registry'
import type { RecallSummary } from '@/shared/market-types'

const VECTOR_LIMIT = 40
const KEYWORD_LIMIT = 20
const VECTOR_BOOST = 80

type RankOpts = NonNullable<Parameters<typeof rankToolItems>[2]>

export type ToolRecallResult = {
  matches: ToolMatch[]
  recallSummary: RecallSummary | null
}

function buildTopVectorTools(
  tools: ToolItem[],
  vectorSimilarity: Map<string, number>,
  limit = 3,
): RecallSummary['topVectorTools'] {
  const nameById = new Map(tools.map((tool) => [tool.id, tool.name]))
  return [...vectorSimilarity.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([toolId]) => ({
      toolId,
      title: nameById.get(toolId) ?? toolId,
    }))
}

export async function recallToolMatches(
  userText: string,
  tools: ToolItem[],
  rankOpts: RankOpts,
): Promise<ToolRecallResult> {
  const keywordMatches = rankToolItems(tools, userText, rankOpts).slice(0, KEYWORD_LIMIT)

  if (process.env.TOOL_VECTOR_RECALL_ENABLED === 'false') {
    return { matches: keywordMatches, recallSummary: null }
  }

  let vectorSimilarity = new Map<string, number>()
  const queryEmbedding = await embedQuery(userText)
  if (queryEmbedding) {
    try {
      vectorSimilarity = await searchToolsByEmbedding(queryEmbedding, VECTOR_LIMIT)
    } catch {
      // fall back to keyword-only
    }
  }

  const includeToolIds = new Set([
    ...keywordMatches.map((m) => m.tool.id),
    ...vectorSimilarity.keys(),
  ])

  const recallSummary: RecallSummary = {
    vectorEnabled: true,
    vectorCount: vectorSimilarity.size,
    keywordCount: keywordMatches.length,
    mergedCount: includeToolIds.size,
    topVectorTools: buildTopVectorTools(tools, vectorSimilarity),
  }

  if (includeToolIds.size === 0) {
    return { matches: keywordMatches, recallSummary }
  }

  return {
    matches: rankToolItems(tools, userText, {
      ...rankOpts,
      includeToolIds,
      vectorSimilarity,
      vectorBoost: VECTOR_BOOST,
    }),
    recallSummary,
  }
}

export async function recallToolMatchesFromCatalog(
  userText: string,
  rankOpts: RankOpts,
): Promise<ToolRecallResult> {
  const tools = await listActiveToolItems()
  return recallToolMatches(userText, tools, rankOpts)
}
