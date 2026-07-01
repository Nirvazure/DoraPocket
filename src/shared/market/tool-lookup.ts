import type { ToolItem } from '@/shared/market/tool-registry'

export type ToolLookupFn = (id: string | null | undefined) => ToolItem | null

export function collectToolIdsFromCandidates(
  toolIds: Iterable<string | null | undefined>,
): string[] {
  const seen = new Set<string>()
  const results: string[] = []
  for (const id of toolIds) {
    if (!id || seen.has(id)) continue
    seen.add(id)
    results.push(id)
  }
  return results
}

export function buildToolLookupMap(tools: ToolItem[]): Map<string, ToolItem> {
  return new Map(tools.map((tool) => [tool.id, tool]))
}
