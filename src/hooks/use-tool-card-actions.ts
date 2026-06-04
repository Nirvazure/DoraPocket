'use client'

import { useAuthenticatedToolActions } from '@/hooks/use-authenticated-tool-actions'

type UseToolCardActionsOptions = {
  authPending: boolean
  isAuthenticated: boolean
  markToolUsed: (input: { toolId: string }) => void
  saveToolToPocket?: (input: {
    toolId: string
    sourceQuestion?: string
    presetArgs?: Record<string, unknown>
  }) => void
  getSourceQuestion?: () => string | undefined
}

export function useToolCardActions(options: UseToolCardActionsOptions) {
  return useAuthenticatedToolActions(options)
}
