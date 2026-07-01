'use client'

import { useMemo } from 'react'
import type { ChatToolPayload } from '@/lib/client/llm'
import { useMarketToolsByIdsQuery } from '@/lib/query/market'
import type { AgentUiPayload } from '@/shared/market/market-types'
import {
  buildToolLookupMap,
  collectToolIdsFromCandidates,
  type ToolLookupFn,
} from '@/shared/market/tool-lookup'

function collectAnalysisToolIds(
  payload: AgentUiPayload | null,
  selectedToolPayload: ChatToolPayload,
): string[] {
  const ids: (string | null | undefined)[] = []
  if (selectedToolPayload?.toolId) ids.push(selectedToolPayload.toolId)
  for (const candidate of payload?.candidates ?? []) {
    if (candidate.toolId) ids.push(candidate.toolId)
  }
  return collectToolIdsFromCandidates(ids)
}

export function useAnalysisToolLookup(
  payload: AgentUiPayload | null,
  selectedToolPayload: ChatToolPayload,
): ToolLookupFn {
  const marketIds = useMemo(
    () => collectAnalysisToolIds(payload, selectedToolPayload),
    [payload, selectedToolPayload],
  )
  const { data: marketTools = [] } = useMarketToolsByIdsQuery(marketIds)
  const marketById = useMemo(() => buildToolLookupMap(marketTools), [marketTools])

  return useMemo(() => (id) => (id ? (marketById.get(id) ?? null) : null), [marketById])
}
