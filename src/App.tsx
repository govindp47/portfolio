import { useEffect, useCallback } from 'react'
import { useStore } from '@/core/hooks/useStore'
import { loadContent } from '@/core/content/contentLoader'
import AmbientPlane from '@/ambient/AmbientPlane'
import ZonePlane from '@/zones/ZonePlane'
import HudPlane from '@/hud/HudPlane'
import OverlayPlane from '@/overlays/OverlayPlane'
import BootSequence from '@/boot/BootSequence'

export default function App() {
  const bootPlayed        = useStore((s) => s.bootPlayed)
  const contentLoaded     = useStore((s) => s.contentLoaded)
  const activeMode        = useStore((s) => s.activeMode)
  const markContentLoaded = useStore((s) => s.markContentLoaded)
  const loadContentAction = useStore((s) => s.loadContent)
  const markBootPlayed    = useStore((s) => s.markBootPlayed)

  // ── Content boot gate ───────────────────────────────────────────────────────
  useEffect(() => {
    loadContent().then((payload) => {
      loadContentAction(payload)
      markContentLoaded()
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Safe Mode boot-skip ─────────────────────────────────────────────────────
  // Per Doc 04 §7: Safe Mode never shows the boot sequence.
  useEffect(() => {
    if (activeMode === 'safe' && !bootPlayed) {
      markBootPlayed()
    }
  }, [activeMode, bootPlayed, markBootPlayed])

  const handleBootComplete = useCallback(() => {
    markBootPlayed()
    // Prefetch remaining zone chunks using idle network capacity (Doc 07 §3.2)
    void import('@/zones/memory-vault/MemoryVaultZone')
    void import('@/zones/timeline-tunnel/TimelineTunnelZone')
    void import('@/zones/arena/ArenaZone')
    void import('@/zones/gateway/GatewayZone')
  }, [markBootPlayed])

  // ── Render: loading ─────────────────────────────────────────────────────────
  if (!contentLoaded) {
    return <div style={{ width: '100vw', height: '100vh', background: 'var(--color-bg)' }} />
  }

  // ── Render: boot sequence ───────────────────────────────────────────────────
  if (!bootPlayed) {
    return <BootSequence onComplete={handleBootComplete} />
  }

  // ── Render: four-layer shell ────────────────────────────────────────────────
  return (
    <div
      id="app-shell"
      style={{
        position:   'relative',
        width:      '100vw',
        height:     '100vh',
        overflow:   'hidden',
        background: 'var(--color-bg)',
      }}
    >
      <AmbientPlane />
      <ZonePlane />
      <HudPlane />
      <OverlayPlane />
    </div>
  )
}