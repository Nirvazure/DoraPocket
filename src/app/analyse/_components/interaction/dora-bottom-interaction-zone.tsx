'use client'

import { useMemo } from 'react'
import { AnalysisInputComposer } from '@/app/analyse/_components/interaction/analysis-input-composer'
import { DialoguePeek } from '@/app/analyse/_components/interaction/dialogue-peek'
import { DoraVoicePlaybackBar } from '@/app/analyse/_components/interaction/dora-voice-playback-bar'
import { PocketDiggingBar } from '@/app/analyse/_components/interaction/pocket-digging-bar'
import { ClarificationActionRow } from '@/app/analyse/_components/interaction/clarification-action-row'
import {
  isInputLockedFlow,
  isClarificationActive,
  type AnalysisFlow,
} from '@/app/analyse/_domain/analysis-stage-content'
import { getVisibleDialogueMessages } from '@/shared/discovery/clarification-session'
import type {
  ClarificationMessage,
  ClarificationSession,
} from '@/shared/discovery/clarification-session-types'
import type { AppState } from '@/store'

type InputMode = 'text' | 'voice'

export type DoraBottomInteractionZoneProps = {
  analysisFlow: AnalysisFlow
  appState: AppState
  botResponse: string
  clarificationSession: ClarificationSession | null
  canSkipVoice: boolean
  inputMode: InputMode
  textFallback: string
  canSendText: boolean
  placeholder: string
  onToggleInputMode: () => void
  onTextChange: (value: string) => void
  onSubmit: () => void
  onHoldToTalkStart: () => void
  onHoldToTalkEnd: () => void
  onCancelVoiceInput: () => void
  onStopVoicePlayback: () => void
  onRevealNow: () => void
  onQuickReply: (text: string) => void
  onToggleDialogueExpanded: () => void
  hideVoiceToggle?: boolean
}

function resolveDialogueMessages(
  clarificationSession: ClarificationSession | null,
  botResponse: string,
  appState: AppState,
): ClarificationMessage[] {
  if (!clarificationSession) return []

  const visible = getVisibleDialogueMessages(
    clarificationSession,
    clarificationSession.dialogueExpanded,
  )
  const streaming = botResponse.trim()
  if (!streaming || (appState !== 'speaking' && clarificationSession.status !== 'thinking')) {
    return visible
  }

  const last = visible[visible.length - 1]
  if (last?.role === 'assistant') {
    return [...visible.slice(0, -1), { role: 'assistant', content: streaming }]
  }
  return [...visible, { role: 'assistant', content: streaming }]
}

function isClarificationDialogueActive(
  clarificationSession: ClarificationSession | null,
  botResponse: string,
) {
  if (!clarificationSession) return false
  return clarificationSession.messages.length > 0 || botResponse.trim().length > 0
}

export function DoraBottomInteractionZone({
  analysisFlow,
  appState,
  botResponse,
  clarificationSession,
  canSkipVoice,
  inputMode,
  textFallback,
  canSendText,
  placeholder,
  onToggleInputMode,
  onTextChange,
  onSubmit,
  onHoldToTalkStart,
  onHoldToTalkEnd,
  onCancelVoiceInput,
  onStopVoicePlayback,
  onRevealNow,
  onQuickReply,
  onToggleDialogueExpanded,
  hideVoiceToggle = false,
}: DoraBottomInteractionZoneProps) {
  const dialogueMessages = useMemo(
    () => resolveDialogueMessages(clarificationSession, botResponse, appState),
    [appState, botResponse, clarificationSession],
  )

  const showDialoguePeek = isClarificationDialogueActive(clarificationSession, botResponse)
  const canExpandEarlier = (clarificationSession?.messages.length ?? 0) > 2
  const showActionRow = clarificationSession?.status === 'clarifying'
  const inputLocked = isInputLockedFlow(analysisFlow)
  const showVoiceBar = appState === 'speaking' && botResponse.trim().length > 0
  const showDiggingBar = analysisFlow.phase === 'analyzing' && !isClarificationActive(analysisFlow)

  return (
    <div className="shrink-0 max-h-[min(38vh,240px)] overflow-hidden border-t border-white/60 bg-white/78 backdrop-blur-md">
      {showDialoguePeek ? (
        <DialoguePeek
          messages={dialogueMessages}
          expanded={clarificationSession?.dialogueExpanded ?? false}
          canExpandEarlier={canExpandEarlier}
          onToggleExpand={onToggleDialogueExpanded}
        />
      ) : null}

      {showActionRow ? (
        <ClarificationActionRow
          quickReplies={clarificationSession?.quickReplies ?? []}
          onQuickReply={onQuickReply}
        />
      ) : null}

      {showVoiceBar ? (
        <DoraVoicePlaybackBar
          appState={appState}
          botResponse={botResponse}
          canSkip={canSkipVoice}
          onSkip={onRevealNow}
        />
      ) : showDiggingBar ? (
        <PocketDiggingBar analysisFlow={analysisFlow} />
      ) : (
        <AnalysisInputComposer
          appState={appState}
          inputMode={inputMode}
          textFallback={textFallback}
          canSendText={canSendText}
          locked={inputLocked}
          placeholder={placeholder}
          hideVoiceToggle={hideVoiceToggle}
          onToggleInputMode={onToggleInputMode}
          onTextChange={onTextChange}
          onSubmit={onSubmit}
          onHoldToTalkStart={onHoldToTalkStart}
          onHoldToTalkEnd={onHoldToTalkEnd}
          onCancelVoiceInput={onCancelVoiceInput}
          onInteractionStart={onStopVoicePlayback}
        />
      )}
    </div>
  )
}
