export type OwnedToolDeleteFailure = 'NOT_FOUND' | 'FORBIDDEN'

export class OwnedToolDeleteError extends Error {
  readonly code: OwnedToolDeleteFailure

  constructor(code: OwnedToolDeleteFailure) {
    super(code)
    this.name = 'OwnedToolDeleteError'
    this.code = code
  }
}

export function assertOwnedToolDeletable(args: {
  tool: { createdByUserId: string | null } | null
  userId: string
}): void {
  if (!args.tool) {
    throw new OwnedToolDeleteError('NOT_FOUND')
  }
  if (args.tool.createdByUserId !== args.userId) {
    throw new OwnedToolDeleteError('FORBIDDEN')
  }
}

export function resolveIsOwnedByViewer(
  createdByUserId: string | null | undefined,
  viewerUserId: string | null | undefined,
): boolean {
  return Boolean(viewerUserId && createdByUserId && createdByUserId === viewerUserId)
}
