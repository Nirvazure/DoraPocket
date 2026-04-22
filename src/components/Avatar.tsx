import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { useStore } from '../store'
import * as THREE from 'three'
import { getAudioFrequency } from '../services/audio'

/** 略下移整模，但向上回收一些空间，让右侧舞台重心更平衡 */
const AVATAR_FLOOR_Y_OFFSET = -0.87

export function Avatar() {
  const group = useRef<THREE.Group>(null)
  
  // Load the solid Doraemon model
  const { scene } = useGLTF('/models/base_basic_shaded.glb')
  
  // Safely clone the scene to prevent strict-mode/hot-reload unmounting issues
  const clonedScene = useMemo(() => scene.clone(), [scene])

  const appState = useStore((state) => state.appState)
  
  // Target values for smooth interpolation
  const targetRotation = useRef(new THREE.Euler(0, 0, 0))
  const targetPosition = useRef(new THREE.Vector3(0, 0, 0))
  const targetScale = useRef(new THREE.Vector3(1.24, 1.24, 1.24))

  useFrame((state) => {
    if (!group.current) return
    const t = state.clock.getElapsedTime()

    // Base procedural transform animation logic for a "solid" model
    // 1. Reset targets to base posture every frame to prevent drift
    const tx = 0
    let ty = 0,
      tz = 0
    let rx = 0, ry = 0, rz = 0
    let sx = 1.24, sy = 1.24, sz = 1.24

    if (appState === 'idle') {
      // Breathing: Slow float and tiny uniform scaling
      ty = Math.sin(t * 1.5) * 0.03
      ry = Math.sin(t * 0.5) * 0.05
      const scaleBase = 1.24 + Math.sin(t * 1.5) * 0.008
      sx = sy = sz = scaleBase

    } else if (appState === 'listening') {
      // Listening: Lean forward and tilt slightly
      tz = 0.1 // move slightly closer
      rx = 0.1
      ry = 0.1
      rz = 0.05

    } else if (appState === 'thinking') {
      // Thinking: Look up and sway side to side
      ty = Math.sin(t * 2) * 0.02
      rx = -0.15
      ry = Math.sin(t * 1.5) * 0.1

    } else if (appState === 'speaking') {
      const freq = getAudioFrequency() // 0-255
      const animationIntensity = freq > 5 ? Math.min(freq / 100, 1) : 0

      // Speaking animation: Bobbing up and down + Jiggling left and right
      ty = animationIntensity * 0.1
      rz = (Math.random() - 0.5) * animationIntensity * 0.1
      // Slight vertical stretch when talking loudly
      sy = 1.24 + animationIntensity * 0.03
      sx = sz = 1.24 - animationIntensity * 0.015
    }

    // 2. Commit computed values to target refs
    targetPosition.current.set(tx, ty + AVATAR_FLOOR_Y_OFFSET, tz)
    targetRotation.current.set(rx, ry, rz)
    targetScale.current.set(sx, sy, sz)

    // Apply smooth interpolation (Lerp) to the actual group
    group.current.position.lerp(targetPosition.current, 0.1)
    
    // Euler lerping
    group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, targetRotation.current.x, 0.1)
    group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, targetRotation.current.y, 0.1)
    group.current.rotation.z = THREE.MathUtils.lerp(group.current.rotation.z, targetRotation.current.z, 0.1)
    
    group.current.scale.lerp(targetScale.current, 0.15)
  })

  // Pre-load the scene if needed, though useGLTF handles caching.
  // We wrap it in a group to control its transforms independently of its internal structure.
  return (
    <group ref={group}>
      <primitive object={clonedScene} />
    </group>
  )
}

// Preload the model to avoid popping
useGLTF.preload('/models/base_basic_shaded.glb')
