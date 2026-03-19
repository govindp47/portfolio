import { useState, useEffect, useRef, useCallback } from 'react'
import { MonoText } from '@/core/design-system/typography'
import { useReducedMotion } from '@/core/hooks/useReducedMotion'
import { BOOT_LINES } from './bootLines'

interface BootSequenceProps {
  onComplete: () => void
}

const SCANLINE_DURATION_MS  = 600
const LINE_INTERVAL_MS      = 100
const FLASH_START_MS        = SCANLINE_DURATION_MS + BOOT_LINES.length * LINE_INTERVAL_MS
const FLASH_DURATION_MS     = 400
const FADEOUT_START_MS      = FLASH_START_MS + FLASH_DURATION_MS
const FADEOUT_DURATION_MS   = 200
const REDUCED_HOLD_MS       = 500

const styles = `
  @keyframes scanline-sweep {
    from { top: 0%; }
    to   { top: 100%; }
  }
  @keyframes pulse-flash {
    0%   { opacity: 1; }
    50%  { opacity: 0.4; }
    100% { opacity: 1; }
  }
  .boot-line-enter {
    animation: boot-line-fade 100ms ease-in forwards;
  }
  @keyframes boot-line-fade {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  .boot-overlay-flash {
    animation: pulse-flash 400ms ease-in-out;
  }
`

export default function BootSequence({ onComplete }: BootSequenceProps) {
  const reducedMotion = useReducedMotion()

  const [visibleLines, setVisibleLines]     = useState<string[]>([])
  const [showScanline, setShowScanline]     = useState(false)
  const [flashing, setFlashing]             = useState(false)
  const [overlayOpacity, setOverlayOpacity] = useState(1)

  const timeoutsRef  = useRef<ReturnType<typeof setTimeout>[]>([])
  const intervalsRef = useRef<ReturnType<typeof setInterval>[]>([])
  const overlayRef   = useRef<HTMLDivElement>(null)

  const scheduleTimeout = useCallback(
    (fn: () => void, ms: number) => {
      const id = setTimeout(fn, ms)
      timeoutsRef.current.push(id)
      return id
    },
    []
  )

  const clearAll = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout)
    intervalsRef.current.forEach(clearInterval)
    timeoutsRef.current  = []
    intervalsRef.current = []
  }, [])

  const startFadeOut = useCallback(() => {
    setOverlayOpacity(0)
    scheduleTimeout(onComplete, FADEOUT_DURATION_MS + 50)
  }, [onComplete, scheduleTimeout])

  const handleSkip = useCallback(() => {
    clearAll()
    setOverlayOpacity(0)
    const id = setTimeout(onComplete, 100)
    timeoutsRef.current.push(id)
  }, [clearAll, onComplete])

  // ── Reduced-motion fast path ───────────────────────────────────────────────
  useEffect(() => {
    if (!reducedMotion) return

    setVisibleLines(BOOT_LINES)
    const id = scheduleTimeout(startFadeOut, REDUCED_HOLD_MS)
    return () => clearTimeout(id)
  }, [reducedMotion]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Full animation sequence ────────────────────────────────────────────────
  useEffect(() => {
    if (reducedMotion) return

    // Phase 1 — scanline
    setShowScanline(true)
    scheduleTimeout(() => setShowScanline(false), SCANLINE_DURATION_MS)

    // Phase 2 — line reveal
    let lineIndex = 0
    const intervalId = setInterval(() => {
      if (lineIndex < BOOT_LINES.length) {
        const line = BOOT_LINES[lineIndex]
        setVisibleLines((prev) => [...prev, line])
        lineIndex++
      } else {
        clearInterval(intervalId)
      }
    }, LINE_INTERVAL_MS)
    intervalsRef.current.push(intervalId)

    // Phase 3 — completion flash
    scheduleTimeout(() => setFlashing(true),  FLASH_START_MS)
    scheduleTimeout(() => setFlashing(false), FLASH_START_MS + FLASH_DURATION_MS)

    // Phase 4 — fade out
    scheduleTimeout(startFadeOut, FADEOUT_START_MS)

    return clearAll
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <style>{styles}</style>

      {/* Overlay */}
      <div
        ref={overlayRef}
        className={flashing ? 'boot-overlay-flash' : undefined}
        style={{
          position:   'fixed',
          inset:      0,
          zIndex:     'var(--z-overlay)' as unknown as number,
          background: 'var(--color-bg)',
          opacity:    overlayOpacity,
          transition: `opacity ${FADEOUT_DURATION_MS}ms ease-out`,
          overflow:   'hidden',
          display:    'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: 'var(--space-8)',
        }}
      >
        {/* Scanline sweep */}
        {showScanline && (
          <div
            style={{
              position:   'absolute',
              left:       0,
              width:      '100%',
              height:     '4px',
              background: 'var(--color-accent)',
              animation:  `scanline-sweep ${SCANLINE_DURATION_MS}ms linear forwards`,
            }}
          />
        )}

        {/* Boot lines */}
        <div
          style={{
            display:       'flex',
            flexDirection: 'column',
            gap:           'var(--space-1)',
            maxWidth:      '640px',
          }}
        >
          {visibleLines.map((line, i) => (
            <div key={i} className="boot-line-enter">
              <MonoText size="sm">{line}</MonoText>
            </div>
          ))}
        </div>

        {/* Skip button */}
        <button
          onClick={handleSkip}
          style={{
            position:        'absolute',
            bottom:          'var(--space-6)',
            right:           'var(--space-6)',
            background:      'transparent',
            border:          '1px solid var(--color-border)',
            color:           'var(--color-text-secondary)',
            fontFamily:      'var(--font-mono)',
            fontSize:        'var(--text-xs)',
            padding:         'var(--space-1) var(--space-3)',
            cursor:          'pointer',
            borderRadius:    'var(--radius-sm)',
            letterSpacing:   '0.08em',
          }}
          aria-label="Skip boot sequence"
        >
          SKIP →
        </button>
      </div>
    </>
  )
}