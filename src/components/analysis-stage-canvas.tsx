import { memo } from 'react'
import { Canvas } from '@react-three/fiber'
import { ContactShadows } from '@react-three/drei'
import { Avatar } from '@/components/Avatar'
import { SceneLights } from '@/components/scene-lights'

export const AnalysisStageCanvas = memo(function AnalysisStageCanvas() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 opacity-85" aria-hidden>
      <Canvas
        camera={{ position: [0, 0.22, 4.35], fov: 42 }}
        gl={{ alpha: true, antialias: true }}
        onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
        style={{ pointerEvents: 'none' }}
      >
        <SceneLights />
        <Avatar />
        <ContactShadows position={[0, -0.87, 0]} opacity={0.32} scale={8.8} blur={2.6} far={4} />
      </Canvas>
    </div>
  )
})
