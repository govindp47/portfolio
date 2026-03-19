import { useEffect, useRef, useState } from 'react'
import { MonoText } from '@/core/design-system/typography'
import { useReducedMotion } from '@/core/hooks/useReducedMotion'

interface StatusBadgeProps {
  version: string
}

const PULSE_DURATION_MS = 3000

const pulseStyles = `
  @keyframes pulse-opacity {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.7; }
  }
  .status-pulse {
    animation: pulse-opacity 600ms ease-in-out 5;
  }
`

export function StatusBadge({ version }: StatusBadgeProps) {
  const reducedMotion = useReducedMotion()
  const [isPulsing, setIsPulsing] = useState(!reducedMotion)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (reducedMotion) return

    timerRef.current = setTimeout(() => {
      setIsPulsing(false)
    }, PULSE_DURATION_MS)

    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current)
      }
    }
  }, [reducedMotion])

  return (
    <>
      <style>{pulseStyles}</style>
      <div
        className={isPulsing ? 'status-pulse' : undefined}
        style={{
          display:    'inline-flex',
          alignItems: 'center',
          padding:    'var(--space-1) var(--space-3)',
          border:     '1px solid var(--color-border-glow)',
          borderRadius: 'var(--radius-sm)',
          marginTop:  'var(--space-4)',
        }}
      >
        <MonoText size="xs">
          {`GovindOS v${version} — STATUS: RUNNING`}
        </MonoText>
      </div>
    </>
  )
}