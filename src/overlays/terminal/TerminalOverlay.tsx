import { useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { GlassPanel, DismissButton } from '@/core/design-system/components'
import { MonoText } from '@/core/design-system/typography'
import { useStore } from '@/core/hooks/useStore'
import { useFocusTrap } from '@/core/hooks/useFocusTrap'
import TerminalHistory from './components/TerminalHistory'
import TerminalInput from './components/TerminalInput'

/**
 * TerminalOverlay — persistent mount, centered modal.
 *
 * Visibility is controlled via CSS visibility/pointer-events (not display:none)
 * to preserve terminal DOM state (history, input) between open/close cycles.
 *
 * Visual: centered on screen, same GlassPanel treatment as ControlRoom.
 * Entry animation: opacity + scale (0.96→1), 200ms ease-out.
 */
export default function TerminalOverlay() {
  const isOpen        = useStore((s) => s.isOpen)
  const closeTerminal = useStore((s) => s.closeTerminal)
  const panelRef      = useRef<HTMLDivElement>(null)

  useFocusTrap(panelRef, isOpen)

  // Escape key to close
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent): void {
      if (e.key === 'Escape' && isOpen) closeTerminal()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, closeTerminal])

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={closeTerminal}
        style={{
          position:      'fixed',
          inset:         0,
          zIndex:        'calc(var(--z-overlay) + 0)' as unknown as number,
          background:    'rgba(0, 0, 0, 0.55)',
          visibility:    isOpen ? 'visible' : 'hidden',
          pointerEvents: isOpen ? 'auto'    : 'none',
          backdropFilter: isOpen ? 'blur(0.2px)' : 'none',
          transition:    'opacity 200ms ease',
          opacity:       isOpen ? 1 : 0,
        }}
        aria-hidden="true"
      />

      {/* Centered wrapper — always in DOM */}
      <div
        style={{
          position:      'fixed',
          inset:         0,
          zIndex:        'calc(var(--z-overlay) + 1)' as unknown as number,
          display:       'flex',
          alignItems:    'center',
          justifyContent:'center',
          padding:       'var(--space-8)',
          visibility:    isOpen ? 'visible' : 'hidden',
          pointerEvents: isOpen ? 'none'    : 'none', // panel overrides
        }}
        role="region"
        aria-label="Terminal"
        aria-hidden={!isOpen}
      >
        {/* Animated panel */}
        <motion.div
          ref={panelRef}
          animate={{
            opacity: isOpen ? 1    : 0,
            scale:   isOpen ? 1    : 0.96,
            y:       isOpen ? 0    : 8,
          }}
          transition={{ duration: 0.2, ease: isOpen ? 'easeOut' : 'easeIn' }}
          style={{
            width:         '100%',
            maxWidth:      '760px',
            height:        'clamp(420px, 60vh, 640px)',
            pointerEvents: isOpen ? 'auto' : 'none',
          }}
        >
          <GlassPanel elevated bordered>
            <div style={containerStyle}>

              {/* Header */}
              <div style={headerStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  {/* Traffic-light dots */}
                  <span style={dotStyle('#ff5f56')} />
                  <span style={dotStyle('#ffbd2e')} />
                  <span style={dotStyle('#27c93f')} />
                  <div style={{ width: 'var(--space-3)' }} />
                  <MonoText size="sm">
                    <span style={{ color: 'var(--color-accent)' }}>govind@os</span>
                    <span style={{ color: 'var(--color-text-muted)' }}>:~$</span>
                  </MonoText>
                </div>
                <DismissButton onClick={closeTerminal} ariaLabel="Close terminal" />
              </div>

              <div style={dividerStyle} />

              {/* History */}
              <div style={historyAreaStyle}>
                <TerminalHistory />
              </div>

              {/* Input */}
              <div style={inputAreaStyle}>
                <TerminalInput />
              </div>

            </div>
          </GlassPanel>
        </motion.div>
      </div>
    </>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const containerStyle: React.CSSProperties = {
  display:       'flex',
  flexDirection: 'column',
  height:        'clamp(420px, 60vh, 640px)',
  overflow:      'hidden',
}

const headerStyle: React.CSSProperties = {
  display:        'flex',
  alignItems:     'center',
  justifyContent: 'space-between',
  padding:        'var(--space-3) var(--space-4)',
  flexShrink:     0,
}

const dividerStyle: React.CSSProperties = {
  height:     '1px',
  background: 'var(--color-border)',
  flexShrink: 0,
}

const historyAreaStyle: React.CSSProperties = {
  flex:      1,
  overflow:  'hidden',
  minHeight: 0,
}

const inputAreaStyle: React.CSSProperties = {
  flexShrink: 0,
  borderTop:  '1px solid var(--color-border)',
}

function dotStyle(color: string): React.CSSProperties {
  return {
    display:      'inline-block',
    width:        '12px',
    height:       '12px',
    borderRadius: '50%',
    background:   color,
    opacity:      0.7,
  }
}