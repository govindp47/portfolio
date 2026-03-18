import React from 'react'
import type { ZoneId } from '@/core/types/zones'

interface NavItemProps {
  zoneId: ZoneId
  label: string
  isActive: boolean
  isDisabled: boolean
  onClick: () => void
}

const NavItem = React.memo(function NavItem({
  label,
  isActive,
  isDisabled,
  onClick,
}: NavItemProps) {
  return (
    <button
      type="button"
      onClick={isActive ? undefined : onClick}
      disabled={isDisabled}
      aria-current={isActive ? 'page' : undefined}
      aria-disabled={isDisabled}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-2) var(--space-3)',
        background: 'transparent',
        border: 'none',
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--text-sm)',
        fontWeight: isActive ? 'var(--font-weight-medium)' : 'var(--font-weight-normal)',
        color: isActive ? 'var(--color-accent)' : 'var(--color-text-secondary)',
        cursor: isActive ? 'default' : isDisabled ? 'not-allowed' : 'pointer',
        pointerEvents: isDisabled && !isActive ? 'none' : 'auto',
        opacity: isDisabled && !isActive ? 0.4 : 1,
        transition: 'color var(--duration-fast) ease, opacity var(--duration-fast) ease',
        outline: 'none',
        whiteSpace: 'nowrap',
        flexShrink: 0,
      }}
    >
      {label}
      {/* Active accent indicator — a thin line below the label */}
      {isActive && (
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            bottom: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '60%',
            height: '2px',
            background: 'var(--color-accent)',
            borderRadius: '1px',
          }}
        />
      )}
    </button>
  )
})

export default NavItem