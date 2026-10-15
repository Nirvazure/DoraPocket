type MarkToolUsed = (input: { toolId: string }) => void
type SaveToolToPocket = (input: { toolId: string; sourceQuestion?: string }) => void

export function openToolById(
  toolId: string,
  markToolUsed: MarkToolUsed,
  options?: { url?: string | null },
): boolean {
  const url = options?.url?.trim() || null
  if (!url) return false
  markToolUsed({ toolId })
  window.open(url, '_blank', 'noopener,noreferrer')
  return true
}

export function saveToolById(
  toolId: string,
  saveToolToPocket: SaveToolToPocket | undefined,
  sourceQuestion?: string,
): boolean {
  if (!saveToolToPocket) return false
  saveToolToPocket({
    toolId,
    sourceQuestion,
  })
  return true
}
