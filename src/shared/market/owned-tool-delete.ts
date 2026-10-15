export type OwnedToolDeleteFailure = 'NOT_FOUND' | 'FORBIDDEN'

export class OwnedToolDeleteError extends Error {
  readonly code: OwnedToolDeleteFailure

  constructor(code: OwnedToolDeleteFailure) {
    super(code)
    this.name = 'OwnedToolDeleteError'
    this.code = code
  }
}

/** A tool can only be deleted by its recorded creator. */
export function canDeleteOwnedTool(args: {
  createdByUserId: string | null | undefined
  userId: string | null | undefined
}): boolean {
  const { createdByUserId, userId } = args
  if (!userId) return false
  return createdByUserId === userId
}

export function assertOwnedToolDeletable(args: {
  tool: { createdByUserId: string | null } | null
  userId: string
}): void {
  if (!args.tool) {
    throw new OwnedToolDeleteError('NOT_FOUND')
  }
  if (!canDeleteOwnedTool({ createdByUserId: args.tool.createdByUserId, userId: args.userId })) {
    throw new OwnedToolDeleteError('FORBIDDEN')
  }
}

export function resolveIsOwnedByViewer(
  createdByUserId: string | null | undefined,
  viewerUserId: string | null | undefined,
): boolean {
  return canDeleteOwnedTool({ createdByUserId, userId: viewerUserId })
}
