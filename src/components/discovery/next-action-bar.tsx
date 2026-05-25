import { FolderOpenDot } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DisplayPanel } from '@/components/ui/display-shell'

type PanelStep = 1 | 2 | 3

/** 底栏不重复 Step 内 CTA：用短文案交代「这一阶段该关注什么」，并预留产品线迭代位（A + D）。 */
const PANEL_GUIDANCE: Record<PanelStep, { eyebrow: string; headline: string; roadmap: string }> = {
  1: {
    eyebrow: '小贴士',
    headline: '先选一个贴近任务的场景模版，多半比空想一句提示更快得到有效推荐。',
    roadmap: '以后这里可以接与你当前草稿相关的捷径（例如一键补全约束）。',
  },
  2: {
    eyebrow: '小贴士',
    headline: '这一屏只管「为什么这样判断」；最终会收敛成「先试谁」，结论在下一步集中给你。',
    roadmap: '若会话变长，这里也可以承载进度摘要或待办提醒类能力。',
  },
  3: {
    eyebrow: '小贴士',
    headline: '建议先按推荐打开工具实操几步；是否收入口袋只看你在卡片里的决定即可。',
    roadmap: '常对比多个候选时，这里以后也能放「并排视角」一类的轻切换。',
  },
}

type NextActionBarProps = {
  /** 与用户左侧主面板一致的步骤（顶栏所选 / 展开步） */
  panelStep: PanelStep
  onOpenPocket: () => void
}

export function NextActionBar({ panelStep, onOpenPocket }: NextActionBarProps) {
  const guide = PANEL_GUIDANCE[panelStep]

  return (
    <DisplayPanel className="flex min-h-[3.25rem] items-center rounded-3xl border-slate-200 bg-white/94 px-3 py-2.5 shadow-lg shadow-slate-900/6 backdrop-blur-xl sm:min-h-[3.5rem]">
      <div className="flex w-full flex-wrap items-center justify-between gap-x-2 gap-y-2">
        <div className="flex min-h-[2.5rem] max-w-[min(100%,42rem)] flex-col justify-center py-0.5">
          <p className="text-[10px] font-bold uppercase leading-none tracking-[0.16em] text-primary">
            {guide.eyebrow}
          </p>
          <p className="mt-1 text-sm font-black leading-snug text-foreground">{guide.headline}</p>
          <p className="mt-1 text-[11px] leading-snug text-muted-foreground">{guide.roadmap}</p>
        </div>
        <div className="flex min-h-[2.5rem] flex-shrink-0 flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            className="h-9 rounded-full px-3.5 text-xs font-bold"
            onClick={onOpenPocket}
          >
            <FolderOpenDot className="mr-1.5 h-3.5 w-3.5" />
            打开口袋
          </Button>
        </div>
      </div>
    </DisplayPanel>
  )
}
