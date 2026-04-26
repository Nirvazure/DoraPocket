import { memo } from 'react'
import { Canvas } from '@react-three/fiber'
import { ContactShadows, OrbitControls } from '@react-three/drei'
import { Avatar } from '@/components/Avatar'
import { SceneLights } from '@/components/scene-lights'

export const AnalysisStageCanvas = memo(function AnalysisStageCanvas() {
  return (
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
  )
})
