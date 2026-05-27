import {
  DoraBottomInteractionZone,
  type DoraBottomInteractionZoneProps,
} from '@/components/dora-bottom-interaction-zone'

export type AnalysisBottomBarProps = DoraBottomInteractionZoneProps

export function AnalysisBottomBar(props: AnalysisBottomBarProps) {
  return <DoraBottomInteractionZone {...props} />
}
