import type { ToolItem } from '@/shared/tool-registry'

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

export function mergeToolLookup(
  getBuiltin: ToolLookupFn,
  marketById: Map<string, ToolItem>,
): ToolLookupFn {
  return (id) => {
    if (!id) return null
    const builtin = getBuiltin(id)
    if (builtin) return builtin
    return marketById.get(id) ?? null
  }
}
