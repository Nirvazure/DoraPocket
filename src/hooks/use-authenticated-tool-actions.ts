'use client'

import { useCallback } from 'react'
import { openToolById, saveToolById } from '@/lib/tool-actions'
import { redirectToLoginUnlessAuthenticated } from '@/lib/query/auth-session'
import type { ToolLookupFn } from '@/shared/tool-lookup'

type SaveToolToPocketFn = (input: {
  toolId: string
  sourceQuestion?: string
  presetArgs?: Record<string, unknown>
}) => void

export type AuthenticatedToolActionsOptions = {
  authPending: boolean
  isAuthenticated: boolean
  markToolUsed: (input: { toolId: string }) => void
  saveToolToPocket?: SaveToolToPocketFn
  getSourceQuestion?: () => string | undefined
  getTool?: ToolLookupFn
}

export function createOpenToolHandler(
  options: Pick<AuthenticatedToolActionsOptions, 'markToolUsed' | 'getTool'>,
) {
  return (toolId: string, url?: string | null) => {
    const resolvedUrl = url ?? options.getTool?.(toolId)?.url
    openToolById(toolId, options.markToolUsed, { url: resolvedUrl })
  }
}

export function createSaveToolHandler(
  options: Pick<
    AuthenticatedToolActionsOptions,
    'authPending' | 'isAuthenticated' | 'saveToolToPocket' | 'getSourceQuestion'
  >,
) {
  return (toolId: string, presetArgs?: Record<string, unknown>) => {
    if (!redirectToLoginUnlessAuthenticated(options.authPending, options.isAuthenticated)) {
      return false
    }
    return saveToolById(toolId, options.saveToolToPocket, options.getSourceQuestion?.(), presetArgs)
  }
}

export function useAuthenticatedToolActions(options: AuthenticatedToolActionsOptions) {
  const {
    markToolUsed,
    getTool,
    authPending,
    isAuthenticated,
    saveToolToPocket,
    getSourceQuestion,
  } = options

  const openTool = useCallback(
    (toolId: string, url?: string | null) => {
      createOpenToolHandler({ markToolUsed, getTool })(toolId, url)
    },
    [getTool, markToolUsed],
  )

  const saveTool = useCallback(
    (toolId: string, presetArgs?: Record<string, unknown>) => {
      return createSaveToolHandler({
        authPending,
        isAuthenticated,
        saveToolToPocket,
        getSourceQuestion,
      })(toolId, presetArgs)
    },
    [authPending, getSourceQuestion, isAuthenticated, saveToolToPocket],
  )

  return { openTool, saveTool }
}
