import {
  DisplayPanel,
  DisplayPanelContent,
  DisplayPanelDescription,
  DisplayPanelHeader,
  DisplayPanelTitle,
} from '@/components/ui/display-shell'

type TaskContextCardProps = {
  currentPrompt: string
}

export function TaskContextCard({ currentPrompt }: TaskContextCardProps) {
  return (
    <DisplayPanel className="rounded-3xl bg-white p-4 shadow-sm">
      <DisplayPanelHeader className="p-0">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">当前任务</p>
        <DisplayPanelTitle className="mt-2 text-lg leading-snug">{currentPrompt}</DisplayPanelTitle>
      </DisplayPanelHeader>
      <DisplayPanelContent className="p-0 pt-2">
        <DisplayPanelDescription className="text-sm">
          DoraPocket 会基于这个任务继续分析意图、比较候选，并给出这次最值得先用的帮助。
        </DisplayPanelDescription>
      </DisplayPanelContent>
    </DisplayPanel>
  )
}
