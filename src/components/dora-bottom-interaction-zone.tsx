'use client'

import { useMemo } from 'react'
import { AnalysisInputComposer } from '@/components/analysis-input-composer'
import { DialoguePeek } from '@/components/dialogue-peek'
import { DoraVoicePlaybackBar } from '@/components/dora-voice-playback-bar'
import { PocketDiggingBar } from '@/components/pocket-digging-bar'
import { Step2ActionRow } from '@/components/step2-action-row'
import {
  isInputLockedFlow,
  isStep2Clarifying,
  type AnalysisFlow,
} from '@/components/discovery/analysis-stage-content'
import { getVisibleDialogueMessages } from '@/shared/step2-session'
import type { Step2Message, Step2Session } from '@/shared/step2-session-types'
import type { AppState } from '@/store'

type InputMode = 'text' | 'voice'

export type DoraBottomInteractionZoneProps = {
  analysisFlow: AnalysisFlow
  appState: AppState
  botResponse: string
  step2Session: Step2Session | null
  showSkip: boolean
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
  onStopVoicePlayback: () => void
  onRevealNow: () => void
  onQuickReply: (text: string) => void
  onSkipRecommendation: () => void
  onToggleDialogueExpanded: () => void
}

function resolveDialogueMessages(
  step2Session: Step2Session | null,
  botResponse: string,
  appState: AppState,
): Step2Message[] {
  if (!step2Session) return []

  const visible = getVisibleDialogueMessages(step2Session, step2Session.dialogueExpanded)
  const streaming = botResponse.trim()
  if (!streaming || (appState !== 'speaking' && step2Session.status !== 'thinking')) {
    return visible
  }

  const last = visible[visible.length - 1]
  if (last?.role === 'assistant') {
    return [...visible.slice(0, -1), { role: 'assistant', content: streaming }]
  }
  return [...visible, { role: 'assistant', content: streaming }]
}

function isStep2DialogueActive(step2Session: Step2Session | null, botResponse: string) {
  if (!step2Session) return false
  return step2Session.messages.length > 0 || botResponse.trim().length > 0
}

export function DoraBottomInteractionZone({
  analysisFlow,
  appState,
  botResponse,
  step2Session,
  showSkip,
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
  onStopVoicePlayback,
  onRevealNow,
  onQuickReply,
  onSkipRecommendation,
  onToggleDialogueExpanded,
}: DoraBottomInteractionZoneProps) {
  const dialogueMessages = useMemo(
    () => resolveDialogueMessages(step2Session, botResponse, appState),
    [appState, botResponse, step2Session],
  )

  const showDialoguePeek = isStep2DialogueActive(step2Session, botResponse)
  const canExpandEarlier = (step2Session?.messages.length ?? 0) > 2
  const showActionRow =
    step2Session?.status === 'clarifying' || (step2Session?.status === 'thinking' && showSkip)
  const inputLocked = isInputLockedFlow(analysisFlow)
  const showVoiceBar = appState === 'speaking' && botResponse.trim().length > 0
  const showDiggingBar = analysisFlow.phase === 'analyzing' && !isStep2Clarifying(analysisFlow)

  return (
    <div className="shrink-0 max-h-[min(38vh,240px)] overflow-hidden border-t border-white/60 bg-white/78 backdrop-blur-md">
      {showDialoguePeek ? (
        <DialoguePeek
          messages={dialogueMessages}
          expanded={step2Session?.dialogueExpanded ?? false}
          canExpandEarlier={canExpandEarlier}
          onToggleExpand={onToggleDialogueExpanded}
        />
      ) : null}

      {showActionRow ? (
        <Step2ActionRow
          quickReplies={step2Session?.quickReplies ?? []}
          showSkip={showSkip}
          onQuickReply={onQuickReply}
          onSkipRecommendation={onSkipRecommendation}
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
          onToggleInputMode={onToggleInputMode}
          onTextChange={onTextChange}
          onSubmit={onSubmit}
          onHoldToTalkStart={onHoldToTalkStart}
          onHoldToTalkEnd={onHoldToTalkEnd}
          onInteractionStart={onStopVoicePlayback}
        />
      )}
    </div>
  )
}
