'use client'

import { useCallback, useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react'
import {
  createEmptyStarterIntake,
  getStarterOutcomeById,
  type StarterConstraintId,
  type StarterIntake,
  type StarterOutcomeId,
  type StarterRoleId,
  type StarterWizardStep,
} from '@/shared/discovery/starter-intake'

export type StarterWizardStateHandle = {
  getStarterIntake: () => StarterIntake
  reset: () => void
}

export function useStarterWizardState(handleRef?: Ref<StarterWizardStateHandle>) {
  const [wizardStep, setWizardStep] = useState<StarterWizardStep>(1)
  const [intake, setIntake] = useState<StarterIntake>(createEmptyStarterIntake)
  const intakeRef = useRef(intake)

  useEffect(() => {
    intakeRef.current = intake
  }, [intake])

  const reset = useCallback(() => {
    setWizardStep(1)
    setIntake(createEmptyStarterIntake())
  }, [])

  useImperativeHandle(
    handleRef,
    () => ({
      getStarterIntake: () => intakeRef.current,
      reset,
    }),
    [reset],
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

  const goNext = useCallback(() => {
    setWizardStep((step) => {
      if (step >= 3) return step
      return (step + 1) as StarterWizardStep
    })
  }, [])

  const goBack = useCallback(() => {
    setWizardStep((step) => {
      if (step <= 1) return step
      return (step - 1) as StarterWizardStep
    })
  }, [])

  return {
    wizardStep,
    intake,
    selectRole,
    toggleConstraint,
    selectOutcome,
    handleCustomTaskChange,
    goNext,
    goBack,
    reset,
  }
}
