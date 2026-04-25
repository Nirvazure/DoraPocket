import { Canvas } from '@react-three/fiber'
import { ContactShadows, OrbitControls } from '@react-three/drei'
import { Sparkles } from 'lucide-react'
import Image from 'next/image'
import { Avatar } from '@/components/Avatar'
import { RightStatusShowcase } from '@/components/right-status-showcase'
import { SceneLights } from '@/components/scene-lights'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { modeImageSrc, type AssistantModeCard } from '@/shared/mode-registry'
import type { AppState } from '@/store'

type ToolDialMode = 'quick' | 'all'

type AnalysisStagePanelProps = {
  appState: AppState
  toolDialRef: React.RefObject<HTMLElement | null>
  toolDialOpen: boolean
  toolDialMode: ToolDialMode
  selectedGadgetKey: string | null
  dialGadgets: AssistantModeCard[]
  onToggleToolDial: () => void
  onSelectDialGadget: (gadget: AssistantModeCard) => void
  onToggleToolDialMode: () => void
  children: React.ReactNode
}

export function AnalysisStagePanel({
  appState,
  toolDialRef,
  toolDialOpen,
  toolDialMode,
  selectedGadgetKey,
  dialGadgets,
  onToggleToolDial,
  onSelectDialGadget,
  onToggleToolDialMode,
  children,
}: AnalysisStagePanelProps) {
  return (
    <section
      ref={toolDialRef}
      className="pointer-events-auto relative flex min-h-[34rem] h-full flex-col overflow-hidden rounded-[2rem] border border-white/80 bg-white/62 shadow-xl shadow-slate-900/8 backdrop-blur-xl xl:min-h-0"
    >
      <div className="absolute inset-x-0 top-0 z-[1] h-20 rounded-t-[2rem] bg-white/92" aria-hidden />
      <div className="relative z-10 shrink-0 border-b border-border/45 bg-white/90 px-5 py-4 backdrop-blur-md">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
            Dora Stage / Live Status
          </p>
          <RightStatusShowcase appState={appState} />
        </div>
      </div>

      <div className="relative min-h-0 flex-1">
        <div className="absolute inset-0 z-0 opacity-85">
          <Canvas
            camera={{ position: [0, 0.22, 4.35], fov: 42 }}
            gl={{ alpha: true, antialias: true }}
            onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
          >
            <SceneLights />
            <Avatar />
            <ContactShadows position={[0, -0.87, 0]} opacity={0.32} scale={8.8} blur={2.6} far={4} />
            <OrbitControls
              enableZoom={true}
              enablePan={false}
              enableRotate={true}
              minDistance={3.7}
              maxDistance={5.1}
              zoomSpeed={0.7}
              target={[0, 0.22, 0]}
              minPolarAngle={1.15}
              maxPolarAngle={1.4}
              minAzimuthAngle={-0.45}
              maxAzimuthAngle={0.45}
            />
          </Canvas>
        </div>
        <div
          className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-white/64 via-white/34 to-white/72"
          aria-hidden
        />
        <div className="relative z-10 min-h-0 flex-1 pointer-events-none" />
        <div className="absolute bottom-4 right-4 z-20 pointer-events-auto">
          <div className="relative">
            <Button
              type="button"
              variant="outline"
              className="h-11 w-11 rounded-full border-white/85 bg-white/94 p-0 text-xs shadow-lg shadow-slate-900/10 backdrop-blur-md hover:bg-white"
              onClick={onToggleToolDial}
              aria-expanded={toolDialOpen}
              aria-label="打开内置道具拨号盘"
            >
              <Sparkles className="h-4 w-4" />
            </Button>
            {toolDialOpen ? (
              <div
                role="menu"
                aria-label="内置工具拨号盘"
                className="absolute bottom-14 right-0 z-10 w-56 rounded-2xl border border-white/85 bg-white/95 p-2 shadow-md"
              >
                <div className="grid grid-cols-1 gap-1.5">
                  {dialGadgets.map((gadget) => {
                    const selected = selectedGadgetKey != null && gadget.selectKey === selectedGadgetKey
                    return (
                      <button
                        key={gadget.title}
                        role="menuitem"
                        type="button"
                        className={cn(
                          'flex items-center gap-2 rounded-full border px-2.5 py-1.5 text-[11px] font-semibold',
                          selected
                            ? 'border-primary bg-primary/12 text-primary'
                            : 'border-white/85 bg-white text-foreground hover:bg-slate-50',
                        )}
                        onClick={() => onSelectDialGadget(gadget)}
                      >
                        <Image
                          src={modeImageSrc(gadget)}
                          alt=""
                          width={16}
                          height={16}
                          className="h-4 w-4 rounded-full object-contain"
                        />
                        <span className="truncate">{gadget.title}</span>
                      </button>
                    )
                  })}
                  <button
                    role="menuitem"
                    type="button"
                    className="rounded-full border border-white/85 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-foreground hover:bg-slate-50"
                    onClick={onToggleToolDialMode}
                  >
                    {toolDialMode === 'quick' ? '更多道具' : '收起道具'}
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {children}
    </section>
  )
}
