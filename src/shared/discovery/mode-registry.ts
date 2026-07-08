export type AssistantModeCard = {
  title: string
  description: string
  imageSrc?: string
  toolId?: string
}

export const DEFAULT_MODE_IMAGE = '/images/assistant-avatar.svg'

const RECOMMENDATION_CARD: AssistantModeCard = {
  title: '道具推荐',
  description: '已为你收敛到当前最值得先试的工具。',
  imageSrc: DEFAULT_MODE_IMAGE,
}

export function modeImageSrc(card: AssistantModeCard): string {
  const value = card.imageSrc?.trim()
  return value && value.length > 0 ? value : DEFAULT_MODE_IMAGE
}

export function pickModeCardAfterTurn(
  _activeKey: string | null,
  selectedToolId?: string,
): AssistantModeCard {
  if (selectedToolId) {
    return { ...RECOMMENDATION_CARD, toolId: selectedToolId }
  }
  return { ...RECOMMENDATION_CARD }
}
