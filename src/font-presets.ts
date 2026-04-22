export type FontPresetId = 'a' | 'b' | 'c' | 'd'

export const FONT_PRESET_STORAGE_KEY = 'dorapocket-font-preset'

export const FONT_PRESETS: { id: FontPresetId; label: string; hint: string }[] = [
  { id: 'a', label: 'A', hint: 'DM Sans 中性' },
  { id: 'b', label: 'B', hint: 'Outfit 几何' },
  { id: 'c', label: 'C', hint: 'Quicksand 柔和' },
  { id: 'd', label: 'D', hint: 'Nunito 圆润' },
]

export function isFontPresetId(v: string): v is FontPresetId {
  return v === 'a' || v === 'b' || v === 'c' || v === 'd'
}
