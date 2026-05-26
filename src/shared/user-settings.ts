export type VoicePlaybackMode = 'off' | 'key-result' | 'full'
export type InputModePreference = 'text' | 'voice'
export type ExplanationMode = 'brief' | 'standard'
export type FontPreset = 'a' | 'b' | 'c' | 'd'

export type UserSettings = {
  voicePlaybackEnabled: boolean
  voicePlaybackMode: VoicePlaybackMode
  soundEffectsEnabled: boolean
  defaultInputMode: InputModePreference
  memoryEnabled: boolean
  builtinToolsEnabled: boolean
  explanationMode: ExplanationMode
  fontPreset: FontPreset
}

export function getDefaultUserSettings(): UserSettings {
  return {
    voicePlaybackEnabled: true,
    voicePlaybackMode: 'key-result',
    soundEffectsEnabled: true,
    defaultInputMode: 'text',
    memoryEnabled: true,
    builtinToolsEnabled: false,
    explanationMode: 'standard',
    fontPreset: 'c',
  }
}
