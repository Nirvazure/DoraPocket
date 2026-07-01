import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import type { Group } from 'three'
import { getAudioFrequency } from '@/lib/client/audio'
import { useStore } from '@/store'

/** 略下移整模，让右侧舞台重心更靠中下 */
const STAGE_MODEL_FLOOR_Y_OFFSET = -1.05

export function DoraStageModel() {
  const group = useRef<Group>(null)
  const startTimeRef = useRef<number | null>(null)

  const { scene } = useGLTF('/models/base_basic_shaded.glb')
  const clonedScene = useMemo(() => scene.clone(), [scene])
  const appState = useStore((state) => state.appState)

  const targetRotation = useRef({ x: 0, y: 0, z: 0 })
  const targetPosition = useRef({ x: 0, y: 0, z: 0 })
  const targetScale = useRef({ x: 1.24, y: 1.24, z: 1.24 })

  const lerp = (from: number, to: number, alpha: number) => from + (to - from) * alpha

  useFrame(() => {
    if (!group.current) return
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now()
    if (startTimeRef.current === null) {
      startTimeRef.current = now
    }
    const t = (now - startTimeRef.current) / 1000

    const tx = 0
    let ty = 0,
      tz = 0
    let rx = 0,
      ry = 0,
      rz = 0
    let sx = 1.24,
      sy = 1.24,
      sz = 1.24

    if (appState === 'idle') {
      ty = Math.sin(t * 1.5) * 0.03
      ry = Math.sin(t * 0.5) * 0.05
      const scaleBase = 1.24 + Math.sin(t * 1.5) * 0.008
      sx = sy = sz = scaleBase
    } else if (appState === 'listening') {
      tz = 0.1
      rx = 0.1
      ry = 0.1
      rz = 0.05
    } else if (appState === 'thinking') {
      ty = Math.sin(t * 2) * 0.02
      rx = -0.15
      ry = Math.sin(t * 1.5) * 0.1
    } else if (appState === 'speaking') {
      const freq = getAudioFrequency()
      const animationIntensity = freq > 5 ? Math.min(freq / 100, 1) : 0

      ty = animationIntensity * 0.1
      rz = (Math.random() - 0.5) * animationIntensity * 0.1
      sy = 1.24 + animationIntensity * 0.03
      sx = sz = 1.24 - animationIntensity * 0.015
    }

    targetPosition.current = { x: tx, y: ty + STAGE_MODEL_FLOOR_Y_OFFSET, z: tz }
    targetRotation.current = { x: rx, y: ry, z: rz }
    targetScale.current = { x: sx, y: sy, z: sz }

    group.current.position.x = lerp(group.current.position.x, targetPosition.current.x, 0.1)
    group.current.position.y = lerp(group.current.position.y, targetPosition.current.y, 0.1)
    group.current.position.z = lerp(group.current.position.z, targetPosition.current.z, 0.1)

    group.current.rotation.x = lerp(group.current.rotation.x, targetRotation.current.x, 0.1)
    group.current.rotation.y = lerp(group.current.rotation.y, targetRotation.current.y, 0.1)
    group.current.rotation.z = lerp(group.current.rotation.z, targetRotation.current.z, 0.1)

    group.current.scale.x = lerp(group.current.scale.x, targetScale.current.x, 0.15)
    group.current.scale.y = lerp(group.current.scale.y, targetScale.current.y, 0.15)
    group.current.scale.z = lerp(group.current.scale.z, targetScale.current.z, 0.15)
  })

  return (
    <group ref={group}>
      <primitive object={clonedScene} />
    </group>
  )
}

useGLTF.preload('/models/base_basic_shaded.glb')
