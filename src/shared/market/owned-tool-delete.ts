import { MARKET_OWNER_USER_ID } from '@/shared/market/market-owner'

export type OwnedToolDeleteFailure = 'NOT_FOUND' | 'FORBIDDEN'

export class OwnedToolDeleteError extends Error {
  readonly code: OwnedToolDeleteFailure

  constructor(code: OwnedToolDeleteFailure) {
    super(code)
    this.name = 'OwnedToolDeleteError'
    this.code = code
  }
}

/** Shared delete authz for API + market UI (keeps seed/null ownership aligned for market owner). */
export function canDeleteOwnedTool(args: {
  createdByUserId: string | null | undefined
  userId: string | null | undefined
}): boolean {
  const { createdByUserId, userId } = args
  if (!userId) return false
  if (createdByUserId === userId) return true
  if (userId !== MARKET_OWNER_USER_ID) return false
  return createdByUserId == null || createdByUserId === MARKET_OWNER_USER_ID
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
