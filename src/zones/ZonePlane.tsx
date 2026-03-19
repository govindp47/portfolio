import { Suspense } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useStore } from '@/core/hooks/useStore'
import { zoneRegistry } from '@/core/utils/zoneRegistry'

/**
 * ZonePlane — Layer 2.
 *
 * Positioned below the fixed HUD bar by starting at top: var(--hud-height).
 * This ensures no zone content is hidden behind the NavBar.
 * The zone itself fills the remaining viewport height.
 */
export default function ZonePlane() {
  const activeZone           = useStore((s) => s.activeZone)
  const onTransitionComplete = useStore((s) => s.onTransitionComplete)

  const { component: CurrentZoneComponent } = zoneRegistry[activeZone]

  return (
    <div
      style={{
        position: 'absolute',
        top:      'var(--hud-height)',
        left:     0,
        right:    0,
        bottom:   0,
        zIndex:   'var(--z-zone)' as unknown as number,
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