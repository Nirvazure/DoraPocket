'use client'

import { useCallback, useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react'
import { analyseStarterIntent } from '@/lib/client/starter-intent'
import {
  createEmptyStarterIntake,
  getStarterOutcomeById,
  type StarterConstraintId,
  type StarterIntake,
  type StarterIntakeDraft,
  type StarterIntentStatus,
  type StarterOutcomeId,
  type StarterRoleId,
} from '@/shared/discovery/starter-intake'

export type StarterWizardStateHandle = {
  getStarterIntake: () => StarterIntake
  applyNaturalDescription: (text: string) => Promise<StarterIntakeDraft | null>
  reset: () => void
}

export function useStarterWizardState(handleRef?: Ref<StarterWizardStateHandle>) {
  const [intake, setIntake] = useState<StarterIntake>(createEmptyStarterIntake)
  const [naturalDescription, setNaturalDescription] = useState('')
  const [lastDraftSource, setLastDraftSource] = useState('')
  const [intentStatus, setIntentStatus] = useState<StarterIntentStatus>('idle')
  const [intentNote, setIntentNote] = useState('')
  const intakeRef = useRef(intake)

  useEffect(() => {
    intakeRef.current = intake
  }, [intake])

  const reset = useCallback(() => {
    setIntake(createEmptyStarterIntake())
    setNaturalDescription('')
    setLastDraftSource('')
    setIntentStatus('idle')
    setIntentNote('')
  }, [])

  const applyDraft = useCallback((draft: StarterIntakeDraft) => {
    if (!draft.sourceText) return null
    setNaturalDescription(draft.sourceText)
    setLastDraftSource(draft.sourceText)
    setIntake({
      roleId: draft.roleId,
      outcomeId: draft.outcomeId,
      customTask: draft.customTask,
      constraintIds: draft.constraintIds,
    })
    setIntentStatus(draft.source === 'fallback' ? 'fallback' : 'ready')
    setIntentNote(
      draft.source === 'fallback'
        ? '已先用快速理解结果，你可以继续修改。'
        : draft.reasoningSummary || '',
    )
    return draft
  }, [])

  const applyNaturalDescription = useCallback(
    async (text: string): Promise<StarterIntakeDraft | null> => {
      const safeText = text.trim()
      if (!safeText) return null
      setIntentStatus('analyzing')
      setIntentNote('')
      const draft = await analyseStarterIntent(safeText)
      return applyDraft(draft)
    },
    [applyDraft],
  )

  useImperativeHandle(
    handleRef,
    () => ({
      getStarterIntake: () => intakeRef.current,
      applyNaturalDescription,
      reset,
    }),
    [applyNaturalDescription, reset],
  )

  const selectRole = useCallback((roleId: StarterRoleId) => {
    setIntake((current) => ({
      ...current,
      roleId,
    }))
  }, [])

  const toggleConstraint = useCallback((constraintId: StarterConstraintId) => {
    setIntake((current) => {
      const exists = current.constraintIds.includes(constraintId)
      return {
        ...current,
        constraintIds: exists
          ? current.constraintIds.filter((id) => id !== constraintId)
          : [...current.constraintIds, constraintId],
      }
    })
  }, [])

  const selectOutcome = useCallback((outcomeId: StarterOutcomeId) => {
    const outcome = getStarterOutcomeById(outcomeId)
    if (!outcome) return
    setIntake((current) => ({
      ...current,
      outcomeId,
      customTask: current.customTask.trim() ? current.customTask : outcome.taskPrompt,
    }))
  }, [])

  const handleCustomTaskChange = useCallback((value: string) => {
    setIntake((current) => {
      const trimmed = value.trim()
      if (!trimmed) {
        return { ...current, customTask: value }
      }
      const outcome = current.outcomeId ? getStarterOutcomeById(current.outcomeId) : undefined
      const matchesOutcome = outcome != null && trimmed === outcome.taskPrompt.trim()
      return {
        ...current,
        customTask: value,
        outcomeId: matchesOutcome ? current.outcomeId : null,
      }
    })
  }, [])

  const handleNaturalDescriptionChange = useCallback((value: string) => {
    setNaturalDescription(value)
  }, [])

  return {
    intake,
    naturalDescription,
    lastDraftSource,
    intentStatus,
    intentNote,
    selectRole,
    toggleConstraint,
    selectOutcome,
    handleCustomTaskChange,
    handleNaturalDescriptionChange,
    applyNaturalDescription,
    reset,
  }
}
