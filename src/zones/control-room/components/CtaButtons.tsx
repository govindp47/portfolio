import { ActionButton } from '@/core/design-system/components'
import { useNavigate } from '@/core/hooks/useNavigate'

/**
 * "View Skills" uses primary variant.
 * "Open Projects" uses secondary variant — visually subordinate, distinct call to action.
 */
export function CtaButtons() {
  const { navigateTo, isTransitioning } = useNavigate()

  const pointerStyle: React.CSSProperties = isTransitioning
    ? { pointerEvents: 'none' }
    : {}

  return (
    <div
      style={{
        display:        'flex',
        flexDirection:  'row',
        gap:            'var(--space-4)',
        marginTop:      'var(--space-6)',
        ...pointerStyle,
      }}
    >
      <ActionButton
        variant="primary"
        onClick={() => navigateTo('neural-graph')}
        disabled={isTransitioning}
      >
        View Skills
      </ActionButton>

      <ActionButton
        variant="secondary"
        onClick={() => navigateTo('memory-vault')}
        disabled={isTransitioning}
      >
        Open Projects
      </ActionButton>
    </div>
  )
}