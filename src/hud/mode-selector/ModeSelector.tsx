import React from 'react'
import { useMode } from '@/core/hooks/useMode'
import { useStore } from '@/core/hooks/useStore'
import type { UserMode } from '@/core/types/modes'

// Short labels chosen for compact HUD context.
// Full names would overflow a tight top-bar layout.
const MODES: { mode: UserMode; label: string }[] = [
  { mode: 'explorer', label: 'EXP' },
  { mode: 'recruiter', label: 'REC' },
  { mode: 'deep', label: 'DEEP' },
  { mode: 'safe', label: 'SAFE' },
]

const ModeSelector = React.memo(function ModeSelector() {
  const { activeMode } = useMode()
  const setMode = useStore((s) => s.setMode)

  return (
    <div
      role="group"
      aria-label="Display mode"
      style={{
        display: 'inline-flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: '2px',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        border: '1px solid var(--color-border)',
      }}
    >
      {MODES.map(({ mode, label }) => {
        const isActive = mode === activeMode
        return (
          <button
            key={mode}
            type="button"
            aria-pressed={isActive}
            onClick={() => setMode(mode)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 'var(--space-1) var(--space-2)',
              background: isActive ? 'var(--color-accent)' : 'transparent',
              color: isActive ? '#0a0b0f' : 'var(--color-text-secondary)',
              border: 'none',
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-xs)',
              fontWeight: isActive
                ? 'var(--font-weight-medium)'
                : 'var(--font-weight-normal)',
              cursor: isActive ? 'default' : 'pointer',
              pointerEvents: isActive ? 'none' : 'auto',
              // No transition — mode switch is instantaneous per contract
              outline: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
})

export default ModeSelector