'use client'

import { Badge } from '@/components/ui/badge'
import { DisplayPanel, DisplayPanelContent } from '@/components/ui/display-shell'

const SCENES = [
  { id: 'hero', label: '求助瞬间', href: '#intro-hero' },
  { id: 'judgement', label: '理解裁决', href: '#intro-judgement' },
  { id: 'market', label: '道具库', href: '#intro-market' },
  { id: 'pocket', label: '我的口袋', href: '#intro-pocket' },
  { id: 'final', label: '现在开始', href: '#intro-final' },
] as const

export function IntroSideProgress() {
  return (
    <aside className="pointer-events-none fixed right-6 top-1/2 z-30 hidden -translate-y-1/2 xl:flex">
      <DisplayPanel className="pointer-events-auto rounded-[2rem] bg-white/68 p-3 shadow-[0_20px_50px_rgba(15,23,42,0.10)] backdrop-blur-2xl">
        <DisplayPanelContent className="p-0">
          <div className="mb-3 px-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">
              Page Guide
            </p>
          </div>
          <div className="relative space-y-2 pl-4">
            <div className="absolute bottom-3 left-[1.3rem] top-3 w-px bg-gradient-to-b from-slate-200 via-slate-200 to-slate-100" />
            {SCENES.map((scene, index) => (
              <a
                key={scene.id}
                href={scene.href}
                className="group relative flex items-center gap-3 rounded-full px-3 py-2 text-[11px] font-bold text-slate-600 transition-all hover:bg-slate-100 hover:text-slate-900"
              >
                <span className="absolute left-[0.18rem] top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-sky-300 transition-all group-hover:bg-sky-400" />
                <Badge
                  variant="outline"
                  className="inline-flex h-6 w-6 items-center justify-center rounded-full border-slate-200 bg-white px-0 text-[10px] text-slate-500"
                >
                  {index + 1}
                </Badge>
                <span>{scene.label}</span>
              </a>
            ))}
          </div>
        </DisplayPanelContent>
      </DisplayPanel>
    </aside>
  )
}
