import { useMode } from '@/core/hooks/useMode'
import ParticleCanvas from './ParticleCanvas'
import BackgroundGrid from './BackgroundGrid'

export default function AmbientPlane() {
  const { capabilities } = useMode()

  if (!capabilities.ambientActive) return null

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 'var(--z-ambient)' as unknown as number,
        pointerEvents: 'none',
      }}
    >
      <BackgroundGrid />
      <ParticleCanvas />
    </div>
  )
}