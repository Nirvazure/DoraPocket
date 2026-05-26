import { AnalysisInputComposer } from '@/components/analysis-input-composer'
import { DoraVoicePlaybackBar } from '@/components/dora-voice-playback-bar'
import { PocketDiggingBar } from '@/components/pocket-digging-bar'
import { isAnalyzingFlow, type AnalysisFlow } from '@/components/discovery/analysis-stage-content'
import type { AppState } from '@/store'

type InputMode = 'text' | 'voice'

type AnalysisBottomBarProps = {
  analysisFlow: AnalysisFlow
  appState: AppState
  botResponse: string
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
}

export function AnalysisBottomBar({
  analysisFlow,
  appState,
  botResponse,
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
}: AnalysisBottomBarProps) {
  if (appState === 'speaking' && botResponse.trim()) {
    return (
      <DoraVoicePlaybackBar
        appState={appState}
        botResponse={botResponse}
        canSkip={canSkipVoice}
        onSkip={onRevealNow}
      />
    )
  }

  if (isAnalyzingFlow(analysisFlow)) {
    return <PocketDiggingBar analysisFlow={analysisFlow} />
  }

  return (
    <AnalysisInputComposer
      appState={appState}
      inputMode={inputMode}
      textFallback={textFallback}
      canSendText={canSendText}
      locked={false}
      placeholder={placeholder}
      onToggleInputMode={onToggleInputMode}
      onTextChange={onTextChange}
      onSubmit={onSubmit}
      onHoldToTalkStart={onHoldToTalkStart}
      onHoldToTalkEnd={onHoldToTalkEnd}
      onInteractionStart={onStopVoicePlayback}
    />
  )
}
