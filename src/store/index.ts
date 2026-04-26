import { create } from 'zustand'
import { createClientId } from '@/lib/id'

export type AppState = 'idle' | 'listening' | 'thinking' | 'speaking'
export type SystemNoticeLevel = 'critical' | 'task' | 'ambient' | 'silent'

export type SystemNotice = {
  id: string //通知id
  level: SystemNoticeLevel //通知级别
  message: string //通知消息
  createdAt: number //通知创建时间
  autoDismissMs?: number //自动消失时间
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
            id: createClientId('notice'),
            createdAt: Date.now(),
          }
        : null,
    }),
  clearSystemNotice: () => set({ systemNotice: null }),
  selectedGadgetKey: null,
  setSelectedGadgetKey: (key) => set({ selectedGadgetKey: key }),
}))
