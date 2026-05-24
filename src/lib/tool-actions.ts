import { resolveToolUrlById } from '@/shared/tool-registry'

type MarkToolUsed = (input: { toolId: string }) => void
type SaveToolToPocket = (input: {
  toolId: string
  sourceQuestion?: string
  presetArgs?: Record<string, unknown>
}) => void

export function openToolById(toolId: string, markToolUsed: MarkToolUsed): boolean {
  const url = resolveToolUrlById(toolId)
  if (!url) return false
  markToolUsed({ toolId })
  window.open(url, '_blank', 'noopener,noreferrer')
  return true
}

export function saveToolById(
  toolId: string,
  saveToolToPocket: SaveToolToPocket | undefined,
  sourceQuestion?: string,
  presetArgs?: Record<string, unknown>,
): boolean {
  if (!saveToolToPocket) return false
  saveToolToPocket({
    toolId,
    sourceQuestion,
    presetArgs,
  })
  return true
}
