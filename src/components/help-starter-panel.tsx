import { BookOpenCheck, FileText, Wand2 } from 'lucide-react'

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
    chips: ['更在意准确', '需要中文结果', '要附来源链接', '尽量免登录', '适合保存复用'],
    Icon: BookOpenCheck,
  },
  {
    id: 'structure',
    title: '整理内容，出结构',
    description: '适合长文总结、信息抽取、会议材料和结构化输出。',
    prompt: '我有一段内容需要整理成清晰结构。请帮我判断这次更适合用哪个工具或处理路径。',
    chips: ['先总结重点', '输出成表格', '提炼行动项', '保留原文脉络', '可能长期复用'],
    Icon: FileText,
  },
  {
    id: 'office',
    title: '办公小工具选型',
    description: '适合 PDF、翻译、去背景、网页摘要等低摩擦任务。',
    prompt: '我有一个办公效率小任务，需要最快找到合适工具。请帮我给出这次最值得先试的选择。',
    chips: ['要最快开始', '免费优先', '免注册优先', '手机也能用', '一次性任务'],
    Icon: Wand2,
  },
]

function buildDraft(scene: StarterScene, selectedChips: string[]) {
  if (selectedChips.length === 0) return scene.prompt
  return `${scene.prompt}\n\n我的限制和偏好：${selectedChips.join('、')}。`
}

type HelpStarterStripProps = {
  onDraftChange: (draft: string) => void
}

export function HelpStarterStrip({ onDraftChange }: HelpStarterStripProps) {
  return (
    <section className="rounded-3xl border border-primary/15 bg-primary/[0.04] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">从一个具体场景开始</p>
          <p className="mt-1 text-sm font-semibold text-foreground">不用想怎么问，先选一个高频求助入口。</p>
        </div>
        <span className="rounded-full border border-primary/15 bg-white px-3 py-1 text-[11px] font-semibold text-primary">
          填入右侧输入框
        </span>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {STARTER_SCENES.map((scene) => {
          const Icon = scene.Icon
          return (
            <button
              key={scene.id}
              type="button"
              className="group rounded-3xl border border-border/60 bg-white p-4 text-left shadow-sm transition-colors hover:border-primary/25 hover:bg-primary/[0.03]"
              onClick={() => onDraftChange(buildDraft(scene, []))}
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/[0.08] text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <Icon className="h-4 w-4" />
              </span>
              <span className="mt-3 block text-sm font-black text-foreground">{scene.title}</span>
              <span className="mt-1 line-clamp-2 block text-xs leading-relaxed text-muted-foreground">
                {scene.description}
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
