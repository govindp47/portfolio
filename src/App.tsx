import { useEffect, useCallback } from 'react'
import { useStore } from '@/core/hooks/useStore'
import { loadContent } from '@/core/content/contentLoader'
import AmbientPlane from '@/ambient/AmbientPlane'
import ZonePlane from '@/zones/ZonePlane'
import HudPlane from '@/hud/HudPlane'
import OverlayPlane from '@/overlays/OverlayPlane'
import BootSequence from '@/boot/BootSequence'

export default function App() {
  const bootPlayed    = useStore((s) => s.bootPlayed)
  const contentLoaded = useStore((s) => s.contentLoaded)
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

  const handleBootComplete = useCallback(() => {
    markBootPlayed()
  }, [markBootPlayed])

  // ── Render: loading ─────────────────────────────────────────────────────────
  // Boot overlay covers this; keep it transparent so there's no flash.
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
        position: 'relative',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
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