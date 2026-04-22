import { useStore } from '@/store'
import type { AppState } from '@/store'

const presets: Record<
  AppState,
  {
    sky: string
    ground: string
    amb: number
    dirPos: [number, number, number]
    dirColor: string
    dirInt: number
    hemi: number
  }
> = {
  idle: {
    sky: '#cfe8ff',
    ground: '#404040',
    amb: 1.2,
    dirPos: [0, 5, 5],
    dirColor: '#ffffff',
    dirInt: 2.0,
    hemi: 0.6,
  },
  listening: {
    sky: '#b8e8ff',
    ground: '#3d4855',
    amb: 1.38,
    dirPos: [0.8, 6, 4],
    dirColor: '#fffef0',
    dirInt: 2.25,
    hemi: 0.68,
  },
  thinking: {
    sky: '#d2dcff',
    ground: '#4a4a52',
    amb: 1.05,
    dirPos: [-1.2, 5.5, 5.5],
    dirColor: '#eef0ff',
    dirInt: 1.65,
    hemi: 0.55,
  },
  speaking: {
    sky: '#ffe8c4',
    ground: '#454038',
    amb: 1.28,
    dirPos: [0, 4.5, 6],
    dirColor: '#fff8e8',
    dirInt: 2.35,
    hemi: 0.62,
  },
}

export function SceneLights() {
  const appState = useStore((s) => s.appState)
  const p = presets[appState]

  return (
    <>
      <ambientLight intensity={p.amb} />
      <hemisphereLight args={[p.sky, p.ground, p.hemi]} />
      <directionalLight position={p.dirPos} intensity={p.dirInt} color={p.dirColor} />
    </>
  )
}
