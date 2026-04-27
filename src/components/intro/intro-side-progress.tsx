'use client'

import { Badge } from '@/components/ui/badge'
import { DisplayPanel, DisplayPanelContent } from '@/components/ui/display-shell'
import { cn } from '@/lib/utils'

type IntroSideProgressProps = {
  activeScene: string
}

const SCENES = [
  { id: 'hero', label: '求助瞬间', href: '#intro-hero' },
  { id: 'judgement', label: '理解裁决', href: '#intro-judgement' },
  { id: 'contrast', label: '价值对比', href: '#intro-contrast' },
  { id: 'market', label: '市场收束', href: '#intro-market' },
  { id: 'pocket', label: '沉淀入口袋', href: '#intro-pocket' },
  { id: 'memory', label: '记忆回流', href: '#intro-memory' },
  { id: 'final', label: '开始使用', href: '#intro-final' },
] as const

export function IntroSideProgress({ activeScene }: IntroSideProgressProps) {
  const activeIndex = Math.max(SCENES.findIndex((scene) => scene.id === activeScene), 0)
  const progressHeight = `${(activeIndex / (SCENES.length - 1)) * 100}%`

  return (
    <aside className="pointer-events-none fixed right-6 top-1/2 z-30 hidden -translate-y-1/2 xl:flex">
      <DisplayPanel className="pointer-events-auto rounded-[2rem] bg-white/68 p-3 shadow-[0_20px_50px_rgba(15,23,42,0.10)] backdrop-blur-2xl">
        <DisplayPanelContent className="p-0">
          <div className="mb-3 px-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">Scroll Story</p>
          </div>
          <div className="relative space-y-2 pl-4">
            <div className="absolute bottom-3 left-[1.3rem] top-3 w-px bg-gradient-to-b from-slate-200 via-slate-200 to-slate-100" />
            <div className="absolute left-[1.3rem] top-3 w-px bg-gradient-to-b from-sky-300 via-cyan-400 to-violet-300 transition-all duration-500" style={{ height: `calc(${progressHeight} - 0.75rem)` }} />
            {SCENES.map((scene, index) => {
              const active = scene.id === activeScene
              const reached = index <= activeIndex

              return (
                <a key={scene.id} href={scene.href} className={cn('group relative flex items-center gap-3 rounded-full px-3 py-2 text-[11px] font-bold transition-all', active ? 'bg-sky-500 text-white shadow-[0_10px_24px_rgba(14,165,233,0.20)]' : reached ? 'text-slate-700 hover:bg-slate-100' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900')}>
                  <span className={cn('absolute left-[0.18rem] top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white transition-all', active ? 'bg-white shadow-[0_0_0_5px_rgba(14,165,233,0.22)]' : reached ? 'bg-sky-400' : 'bg-slate-200 group-hover:bg-slate-300')} />
                  <Badge variant={active ? 'dark' : 'outline'} className={cn('inline-flex h-6 w-6 items-center justify-center rounded-full px-0 text-[10px]', active ? 'border-white/30 bg-white/10 text-white' : 'border-slate-200 bg-white text-slate-500')}>
                    {index + 1}
                  </Badge>
                  <span>{scene.label}</span>
                </a>
              )
            })}
          </div>
        </DisplayPanelContent>
      </DisplayPanel>
    </aside>
  )
}
