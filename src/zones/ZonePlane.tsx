import { Suspense } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useStore } from '@/core/hooks/useStore'
import { zoneRegistry } from '@/core/utils/zoneRegistry'

export default function ZonePlane() {
  const activeZone = useStore((s) => s.activeZone)
  const onTransitionComplete = useStore((s) => s.onTransitionComplete)

  const { component: CurrentZoneComponent } = zoneRegistry[activeZone]

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 'var(--z-zone)' as unknown as number,
        width: '100%',
        height: '100%',
      }}
    >
      <Suspense fallback={null}>
        <AnimatePresence mode="wait" onExitComplete={onTransitionComplete}>
          <CurrentZoneComponent key={activeZone} />
        </AnimatePresence>
      </Suspense>
    </div>
  )
}