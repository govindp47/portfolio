// HUD Layout: fixed top bar spanning full width.
// NavBar (left) and ModeSelector (right) sit in a single horizontal row.
// HUD is always pointer-events: none at the container level;
// interactive children override with pointer-events: auto.
// will-change: transform hoisted to root for GPU compositing (Doc 07 §4.1).
//
// Deferred Phase 7 slots:
//   <MiniMap />   — enabled when capabilities.miniMapAvailable && gameLayer.isActive
//   <GameHud />   — enabled when capabilities.gameLayerActive
// These will be uncommented and implemented in Phase 7.

import NavBar from '@/hud/navbar/NavBar'
import ModeSelector from '@/hud/mode-selector/ModeSelector'

export default function HudPlane() {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 'var(--z-hud)' as unknown as number,
        pointerEvents: 'none',
        willChange: 'transform',
      }}
    >
      {/* Top bar */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 'var(--space-2) var(--space-4)',
          pointerEvents: 'auto',
          background: 'var(--color-surface-glass, rgba(10, 11, 15, 0.72))',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <NavBar />
        <ModeSelector />
      </div>

      {/* Phase 7 deferred slots — do not activate until Phase 7 */}
      {/* {capabilities.miniMapAvailable && <MiniMap />} */}
      {/* {capabilities.gameLayerActive && <GameHud />} */}
    </div>
  )
}