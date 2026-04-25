import { create } from 'zustand' //

export type AppState = 'idle' | 'listening' | 'thinking' | 'speaking'
export type SystemNoticeLevel = 'critical' | 'task' | 'ambient' | 'silent'

export type SystemNotice = {
  id: string
  level: SystemNoticeLevel
  message: string
  createdAt: number
  autoDismissMs?: number
}

interface DoraStore {
  appState: AppState
  setAppState: (state: AppState) => void
  transcript: string
  setTranscript: (text: string) => void
  botResponse: string
  setBotResponse: (text: string) => void
  lastSpeechError: string
  setLastSpeechError: (msg: string) => void
  systemNotice: SystemNotice | null
  setSystemNotice: (notice: Omit<SystemNotice, 'id' | 'createdAt'> | null) => void
  clearSystemNotice: () => void
  selectedGadgetKey: string | null
  setSelectedGadgetKey: (key: string | null) => void
}

export const useStore = create<DoraStore>((set) => ({
  appState: 'idle',
  setAppState: (state) => set({ appState: state }),
  transcript: '',
  setTranscript: (text) => set({ transcript: text }),
  botResponse: '',
  setBotResponse: (text) => set({ botResponse: text }),
  lastSpeechError: '',
  setLastSpeechError: (msg) => set({ lastSpeechError: msg }),
  systemNotice: null,
  setSystemNotice: (notice) =>
    set({
      systemNotice: notice
        ? {
            ...notice,
            id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
            createdAt: Date.now(),
          }
        : null,
    }),
  clearSystemNotice: () => set({ systemNotice: null }),
  selectedGadgetKey: null,
  setSelectedGadgetKey: (key) => set({ selectedGadgetKey: key }),
}))
