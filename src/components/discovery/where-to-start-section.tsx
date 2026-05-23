import { BookOpenCheck, FileText, GitBranch, Wand2 } from 'lucide-react'
import { DisplayPanel, DisplayPanelContent } from '@/components/ui/display-shell'

type StarterScene = {
  id: string
  title: string
  description: string
  prompt: string
  chips: string[]
  Icon: typeof BookOpenCheck
}

const STARTER_SCENES: StarterScene[] = [
  {
    id: 'research',
    title: '查资料，要引用',
    description: '适合需要可靠来源、出处和对比判断的任务。',
    prompt: '我需要查一个资料，并希望结果带可靠引用。请帮我判断这次先用哪个工具，以及为什么。',
    chips: ['准确优先', '要附来源', '减少试错'],
    Icon: BookOpenCheck,
  },
  {
    id: 'structure',
    title: '整理内容，出结构',
    description: '适合长文总结、信息抽取、会议材料和结构化输出。',
    prompt: '我有一段内容需要整理成清晰结构。请帮我判断这次更适合用哪个工具或处理路径。',
    chips: ['提炼重点', '保留脉络', '结构清晰'],
    Icon: FileText,
  },
  {
    id: 'office',
    title: '办公小工具选型',
    description: '适合 PDF、翻译、去背景、网页摘要等低摩擦任务。',
    prompt: '我有一个办公效率小任务，需要最快找到合适工具。请帮我给出这次最值得先试的选择。',
    chips: ['最快开始', '免费优先', '免注册优先'],
    Icon: Wand2,
  },
]

const THINKING_STEPS = [
  {
    title: '先理解处境',
    body: 'DoraPocket 会先看这次任务的目标、限制、时间压力和开始门槛。',
  },
  {
    title: '再收束候选',
    body: '从很多工具和路径里排掉此刻不合适的，把注意力留给少数可行动方案。',
  },
  {
    title: '最后给出裁决',
    body: '先给结论，再给理由，再给下一步动作，不让你继续研究一堆选项。',
  },
]

type WhereToStartSectionProps = {
  onDraftTask?: (draft: string) => void
}

export function WhereToStartSection({ onDraftTask }: WhereToStartSectionProps) {
  const handleDraftScene = (draft: string) => {
    onDraftTask?.(draft)
  }

  return (
    <div className="space-y-3">
      <section className="rounded-[1.8rem] border border-primary/15 bg-primary/[0.04] p-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
            从一个具体场景开始
          </p>
          <p className="mt-1 text-sm font-semibold text-foreground">
            选一个接近的入口，DoraPocket 会把它变成可分析的任务草稿。
          </p>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {STARTER_SCENES.map((scene) => {
            const Icon = scene.Icon
            return (
              <button
                key={scene.id}
                type="button"
                data-starter-scene={scene.id}
                className="group rounded-[1.35rem] border border-border/60 bg-white p-4 text-left shadow-sm transition-colors hover:border-primary/25 hover:bg-primary/[0.03]"
                onClickCapture={() => handleDraftScene(scene.prompt)}
                onMouseDown={() => handleDraftScene(scene.prompt)}
                onPointerUp={() => handleDraftScene(scene.prompt)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    handleDraftScene(scene.prompt)
                  }
                }}
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/[0.08] text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="mt-3 block text-sm font-black text-foreground">{scene.title}</span>
                <span className="mt-1 line-clamp-2 block text-xs leading-relaxed text-muted-foreground">
                  {scene.description}
                </span>
                <span className="mt-3 flex flex-wrap gap-1.5">
                  {scene.chips.map((chip) => (
                    <span
                      key={chip}
                      className="rounded-full border border-primary/10 bg-primary/[0.04] px-2 py-1 text-[10px] font-bold text-primary/80"
                    >
                      {chip}
                    </span>
                  ))}
                </span>
              </button>
            )
          })}
        </div>
      </section>

      <DisplayPanel className="rounded-[1.8rem] border-border/70 bg-white shadow-sm">
        <DisplayPanelContent className="p-4 sm:p-4">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-primary">
              <GitBranch className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-black text-foreground">DoraPocket 会怎么开始思考</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                它不是把工具海倒给你，而是先把这次该怎么出手收束清楚。
              </p>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            {THINKING_STEPS.map((step, index) => (
              <div key={step.title} className="grid gap-3 sm:grid-cols-[6.5rem_minmax(0,1fr)]">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/[0.1] text-[11px] font-black text-primary">
                    0{index + 1}
                  </span>
                  <span className="text-xs font-black text-foreground">{step.title}</span>
                </div>
                <div className="relative border-l border-primary/20 pl-4 sm:border-l-0 sm:pl-0">
                  <div className="hidden sm:block absolute left-[-0.75rem] top-3 h-px w-2 bg-primary/25" />
                  <p className="text-sm leading-7 text-muted-foreground">{step.body}</p>
                </div>
              </div>
            ))}
          </div>
        </DisplayPanelContent>
      </DisplayPanel>
    </div>
  )
}
