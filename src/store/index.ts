import { create } from 'zustand' //
import {
  loadPocketInventory,  // 加载口袋库存
  savePocketInventory,  // 保存口袋库存
  sortPocketInventory,  // 排序口袋库存
  upsertPocketItem,  // 更新口袋库存
  type PocketInventoryItem,  // 口袋库存项类型
} from '@/services/pocket-inventory'
import { recordToolOpened, recordToolSaved } from '@/services/market-storage'

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
  pocketInventory: PocketInventoryItem[]
  saveToolToPocket: (toolId: string, sourceQuestion?: string, presetArgs?: Record<string, unknown>) => void
  removeToolFromPocket: (toolId: string) => void
  togglePinTool: (toolId: string) => void
  toggleArchiveTool: (toolId: string) => void
  markToolUsed: (toolId: string) => void
  /** 仅在浏览器挂载后调用，从 localStorage 恢复口袋，避免 SSR 与客户端首帧不一致 */
  hydratePocketInventory: () => void
}

/** 不在模块顶层读 localStorage，否则服务端为 []、浏览器初始化时为已存数据，会导致水合不一致 */
const initialPocketInventory: PocketInventoryItem[] = []

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
  pocketInventory: initialPocketInventory,
  hydratePocketInventory: () =>
    set({ pocketInventory: sortPocketInventory(loadPocketInventory()) }),
  saveToolToPocket: (toolId, sourceQuestion, presetArgs) =>
    set((state) => {
      const next = upsertPocketItem(state.pocketInventory, toolId, { sourceQuestion, presetArgs })
      recordToolSaved(toolId)
      savePocketInventory(next)
      return { pocketInventory: next }
    }),
  removeToolFromPocket: (toolId) =>
    set((state) => {
      const next = state.pocketInventory.filter((item) => item.toolId !== toolId)
      savePocketInventory(next)
      return { pocketInventory: next }
    }),
  togglePinTool: (toolId) =>
    set((state) => {
      const current = state.pocketInventory.find((item) => item.toolId === toolId)
      if (!current) return {}
      const next = upsertPocketItem(state.pocketInventory, toolId, { pinned: !current.pinned })
      savePocketInventory(next)
      return { pocketInventory: next }
    }),
  toggleArchiveTool: (toolId) =>
    set((state) => {
      const current = state.pocketInventory.find((item) => item.toolId === toolId)
      if (!current) return {}
      const next = upsertPocketItem(state.pocketInventory, toolId, { archived: !current.archived })
      savePocketInventory(next)
      return { pocketInventory: next }
    }),
  markToolUsed: (toolId) =>
    set((state) => {
      recordToolOpened(toolId)
      const current = state.pocketInventory.find((item) => item.toolId === toolId)
      if (!current) return {}
      const next = upsertPocketItem(state.pocketInventory, toolId, {
        lastUsedAt: Date.now(),
        useCount: current.useCount + 1,
      })
      savePocketInventory(next)
      return { pocketInventory: next }
    }),
}))
