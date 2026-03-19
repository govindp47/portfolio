import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GlassPanel, DismissButton, SectionHeading } from '@/core/design-system/components'
import { BodyText } from '@/core/design-system/typography'
import { useFocusTrap } from '@/core/hooks/useFocusTrap'
import { useStore } from '@/core/hooks/useStore'
import { useReducedMotion } from '@/core/hooks/useReducedMotion'

export default function QuizModal() {
  const overlayStack  = useStore((s) => s.overlayStack)
  const closeOverlay  = useStore((s) => s.closeOverlay)
  const reducedMotion = useReducedMotion()

  const isOpen      = overlayStack.includes('quiz-modal')
  const panelRef    = useRef<HTMLDivElement>(null)

  useFocusTrap(panelRef, isOpen)

  // Escape key handler
  useEffect(() => {
    if (!isOpen) return
    function handleKeyDown(e: KeyboardEvent): void {
      if (e.key === 'Escape') closeOverlay('quiz-modal')
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, closeOverlay])

  const panelMotion = reducedMotion
    ? {}
    : {
        initial:  { opacity: 0, scale: 0.95 },
        animate:  { opacity: 1, scale: 1,   transition: { duration: 0.2 } },
        exit:     { opacity: 0,              transition: { duration: 0.15 } },
      }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            style={backdropStyle}
            onClick={() => closeOverlay('quiz-modal')}
            aria-hidden="true"
          />

          {/* Modal panel */}
          <div style={centeredWrapperStyle} role="dialog" aria-modal="true" aria-label="Skill Challenge">
            <motion.div ref={panelRef} {...panelMotion} style={panelContainerStyle}>
              <GlassPanel elevated>
                <div style={innerStyle}>
                  {/* Header row */}
                  <div style={headerRowStyle}>
                    <SectionHeading>Skill Challenge</SectionHeading>
                    <DismissButton
                      onClick={() => closeOverlay('quiz-modal')}
                      ariaLabel="Close skill challenge modal"
                    />
                  </div>

                  <BodyText>
                    <span style={{ color: 'var(--color-text-muted)' }}>
                      (Quiz content coming soon)
                    </span>
                  </BodyText>
                </div>
              </GlassPanel>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const backdropStyle: React.CSSProperties = {
  position:   'fixed',
  inset:      0,
  background: 'rgba(0, 0, 0, 0.6)',
  zIndex:     'var(--z-overlay)' as unknown as number,
}

const centeredWrapperStyle: React.CSSProperties = {
  position:       'fixed',
  inset:          0,
  display:        'flex',
  alignItems:     'center',
  justifyContent: 'center',
  zIndex:         ('calc(var(--z-overlay) + 1)') as unknown as number,
  pointerEvents:  'none',
}

const panelContainerStyle: React.CSSProperties = {
  pointerEvents: 'auto',
  width:         '100%',
  maxWidth:      '480px',
  margin:        'var(--space-4)',
}

const innerStyle: React.CSSProperties = {
  padding:       'var(--space-6)',
  display:       'flex',
  flexDirection: 'column',
  gap:           'var(--space-4)',
}

const headerRowStyle: React.CSSProperties = {
  display:        'flex',
  alignItems:     'center',
  justifyContent: 'space-between',
}