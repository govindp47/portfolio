import { useEffect, useCallback } from 'react'
import NavBar from '@/hud/navbar/NavBar'
import ModeSelector from '@/hud/mode-selector/ModeSelector'
import { useStore } from '@/core/hooks/useStore'

export default function HudPlane() {
  const isOpen        = useStore((s) => s.isOpen)
  const openTerminal  = useStore((s) => s.openTerminal)
  const closeTerminal = useStore((s) => s.closeTerminal)

  const toggleTerminal = useCallback(() => {
    if (isOpen) closeTerminal()
    else openTerminal()
  }, [isOpen, openTerminal, closeTerminal])

  // Global backtick shortcut to toggle terminal
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent): void {
      if (e.key === '`' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        // Only toggle if focus is not inside an input/textarea
        const tag = (document.activeElement as HTMLElement)?.tagName
        if (tag === 'INPUT' || tag === 'TEXTAREA') return
        e.preventDefault()
        toggleTerminal()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [toggleTerminal])

  return (
    <div
      style={{
        position:      'fixed',
        top:           0,
        left:          0,
        right:         0,
        zIndex:        'var(--z-hud)' as unknown as number,
        pointerEvents: 'none',
        willChange:    'transform',
      }}
    >
      {/* Top bar */}
      <div
        style={{
          display:        'flex',
          flexDirection:  'row',
          alignItems:     'center',
          justifyContent: 'space-between',
          padding:        'var(--space-2) var(--space-4)',
          pointerEvents:  'auto',
          background:     'var(--color-surface-glass, rgba(10, 11, 15, 0.72))',
          backdropFilter: 'blur(12px)',
          borderBottom:   '1px solid var(--color-border)',
        }}
      >
        <NavBar />

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          {/* Terminal toggle button */}
          <button
            type="button"
            onClick={toggleTerminal}
            aria-label={isOpen ? 'Close terminal' : 'Open terminal'}
            aria-pressed={isOpen}
            style={{
              background:   isOpen ? 'var(--color-accent)' : 'transparent',
              border:       `1px solid ${isOpen ? 'var(--color-accent)' : 'var(--color-border)'}`,
              borderRadius: 'var(--radius-sm)',
              color:        isOpen ? '#0a0b0f' : 'var(--color-text-secondary)',
              fontFamily:   'var(--font-mono)',
              fontSize:     'var(--text-xs)',
              padding:      'var(--space-1) var(--space-2)',
              cursor:       'pointer',
              letterSpacing: '0.06em',
            }}
          >
            &gt;_
          </button>

          <ModeSelector />
        </div>
      </div>
    </div>
  )
}