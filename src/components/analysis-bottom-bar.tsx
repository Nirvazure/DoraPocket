import { AnalysisInputComposer } from '@/components/analysis-input-composer'
import { PocketDiggingBar } from '@/components/pocket-digging-bar'
import { isAnalyzingFlow, type AnalysisFlow } from '@/components/discovery/analysis-stage-content'
import type { AppState } from '@/store'

type InputMode = 'text' | 'voice'

type AnalysisBottomBarProps = {
  analysisFlow: AnalysisFlow
  appState: AppState
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
}

export function AnalysisBottomBar({
  analysisFlow,
  appState,
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
}: AnalysisBottomBarProps) {
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
