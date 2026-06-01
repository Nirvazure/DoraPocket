'use client'

import { memo, useCallback, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { ContactShadows, OrbitControls } from '@react-three/drei'
import { Avatar } from '@/components/Avatar'
import { AnalysisStageCanvasFallback } from '@/components/analysis-stage-canvas-fallback'
import { SceneLights } from '@/components/scene-lights'
import type { WebGLRenderer } from 'three'

const STAGE_TARGET_Y = 0.04
const AVATAR_FLOOR_Y = -1.05

export const AnalysisStageCanvas = memo(function AnalysisStageCanvas() {
  const [contextLost, setContextLost] = useState(false)

  const onCreated = useCallback(({ gl }: { gl: WebGLRenderer }) => {
    gl.setClearColor(0x000000, 0)
    const canvas = gl.domElement
    const handleContextLost = (event: Event) => {
      event.preventDefault()
      setContextLost(true)
    }
    canvas.addEventListener('webglcontextlost', handleContextLost, false)
  }, [])

  if (contextLost) {
    return <AnalysisStageCanvasFallback variant="unavailable" />
  }

  return (
    <div className="absolute inset-0 z-0 opacity-85">
      <Canvas
        camera={{ position: [0, STAGE_TARGET_Y, 4.35], fov: 42 }}
        gl={{ alpha: true, antialias: true }}
        onCreated={onCreated}
      >
        <SceneLights />
        <Avatar />
        <ContactShadows
          position={[0, AVATAR_FLOOR_Y, 0]}
          opacity={0.32}
          scale={8.8}
          blur={2.6}
          far={4}
        />
        <OrbitControls
          enableZoom
          enablePan={false}
          enableRotate
          minDistance={3.7}
          maxDistance={5.1}
          zoomSpeed={0.7}
          target={[0, STAGE_TARGET_Y, 0]}
          minPolarAngle={1.15}
          maxPolarAngle={1.4}
          minAzimuthAngle={-0.45}
          maxAzimuthAngle={0.45}
        />
      </Canvas>
    </div>
  )
})
