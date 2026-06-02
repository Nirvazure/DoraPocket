'use client'

import { useMemo } from 'react'
import type { ChatToolPayload } from '@/lib/client/llm'
import { useMarketToolsByIdsQuery } from '@/lib/query/market'
import type { AgentUiPayload } from '@/shared/market-types'
import {
  buildToolLookupMap,
  collectToolIdsFromCandidates,
  mergeToolLookup,
  type ToolLookupFn,
} from '@/shared/tool-lookup'
import { getBuiltinToolById } from '@/shared/tool-registry'

function collectAnalysisToolIds(
  payload: AgentUiPayload | null,
  selectedToolPayload: ChatToolPayload,
): string[] {
  const ids: (string | null | undefined)[] = []
  if (selectedToolPayload?.toolId) ids.push(selectedToolPayload.toolId)
  for (const candidate of payload?.candidates ?? []) {
    if (candidate.toolId) ids.push(candidate.toolId)
  }
  return collectToolIdsFromCandidates(ids).filter((id) => !getBuiltinToolById(id))
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

  return useMemo(() => mergeToolLookup(getBuiltinToolById, marketById), [marketById])
}
