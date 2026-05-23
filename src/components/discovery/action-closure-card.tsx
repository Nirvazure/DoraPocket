import { useState } from 'react'
import { CheckCircle2, RotateCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DisplayPanel,
  DisplayPanelContent,
  DisplayPanelHeader,
  DisplayPanelTitle,
} from '@/components/ui/display-shell'

type ActionClosureCardProps = {
  leaderToolId: string | null
  autoSaveNotice: { toolId: string; label: string } | null
  autoSaveEnabled: boolean
  onOpenPocket: () => void
  onUndoAutoSave: () => void
  onEnableAutoSave: () => void
  onFeedback: (toolId: string, vote: 'up' | 'down') => void
}

const FEEDBACK_OPTIONS = ['解决了', '不适合', '太复杂', '太贵', '想换一个'] as const

export function ActionClosureCard({
  leaderToolId,
  autoSaveNotice,
  autoSaveEnabled,
  onOpenPocket,
  onUndoAutoSave,
  onEnableAutoSave,
  onFeedback,
}: ActionClosureCardProps) {
  const [selectedFeedback, setSelectedFeedback] = useState<string | null>(null)

  const recordFeedback = (option: (typeof FEEDBACK_OPTIONS)[number]) => {
    setSelectedFeedback(option)
    if (!leaderToolId) return
    onFeedback(leaderToolId, option === '解决了' ? 'up' : 'down')
  }

  return (
    <DisplayPanel className="rounded-[1.8rem] border-border/70 bg-white shadow-sm">
      <DisplayPanelHeader className="space-y-2">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">行动闭环</p>
        <DisplayPanelTitle className="text-xl text-foreground">
          试用之后，把结果留在你的口袋里
        </DisplayPanelTitle>
      </DisplayPanelHeader>
      <DisplayPanelContent className="grid gap-3 lg:grid-cols-[1fr_auto]">
        <div className="rounded-3xl border border-border/60 bg-slate-50/90 p-4">
          <p className="text-sm font-semibold text-foreground">
            {autoSaveNotice
              ? `${autoSaveNotice.label} 已经收进口袋`
              : '试用之后，如果你觉得这次真的有用，再把它留作下次的可复用入口。'}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              className="h-8 rounded-full px-3 text-[11px]"
              onClick={onOpenPocket}
            >
              查看我的口袋
            </Button>
            {autoSaveNotice ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-8 rounded-full bg-white px-3 text-[11px]"
                onClick={onUndoAutoSave}
              >
                撤销
              </Button>
            ) : null}
            {!autoSaveEnabled ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-8 rounded-full bg-white px-3 text-[11px]"
                onClick={onEnableAutoSave}
              >
                <RotateCw className="mr-1 h-3 w-3" />
                开启自动收进口袋
              </Button>
            ) : null}
          </div>
        </div>
        <DisplayPanel className="rounded-3xl border-border/60 bg-white p-3 shadow-none">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
              这次解决了吗？
            </p>
            {selectedFeedback ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : null}
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {leaderToolId
              ? FEEDBACK_OPTIONS.map((option) => (
                  <Button
                    key={option}
                    type="button"
                    variant={selectedFeedback === option ? 'default' : 'outline'}
                    className={
                      selectedFeedback === option
                        ? 'h-auto rounded-full px-2.5 py-1 text-[11px]'
                        : 'h-auto rounded-full border-border/70 bg-slate-50 px-2.5 py-1 text-[11px] text-foreground/75 hover:border-primary/25'
                    }
                    onClick={() => recordFeedback(option)}
                  >
                    {option}
                  </Button>
                ))
              : null}
          </div>
          {selectedFeedback ? (
            <p className="mt-2 text-[11px] font-semibold text-muted-foreground">
              已记录：下次会参考这次反馈。
            </p>
          ) : null}
        </DisplayPanel>
      </DisplayPanelContent>
    </DisplayPanel>
  )
}
