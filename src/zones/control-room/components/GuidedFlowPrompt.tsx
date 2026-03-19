import { motion } from 'framer-motion'
import { DismissButton } from '@/core/design-system/components'
import { useNavigate } from '@/core/hooks/useNavigate'
import { useReducedMotion } from '@/core/hooks/useReducedMotion'

interface GuidedFlowPromptProps {
  onDismiss: () => void
}

export function GuidedFlowPrompt({ onDismiss }: GuidedFlowPromptProps) {
  const { navigateTo } = useNavigate()
  const reducedMotion  = useReducedMotion()

  function handleSkillsClick() {
    navigateTo('neural-graph')
    onDismiss()
  }

  const motionProps = reducedMotion
    ? {}
    : {
        initial:    { opacity: 0 },
        animate:    { opacity: 1, transition: { duration: 0.25 } },
        exit:       { opacity: 0, transition: { duration: 0.15 } },
      }

  return (
    <motion.div
      {...motionProps}
      style={containerStyle}
      role="note"
      aria-label="Getting started suggestion"
    >
      <span style={textStyle}>
        New here?{' '}
        <button onClick={handleSkillsClick} style={linkStyle}>
          Start with Skills →
        </button>
      </span>
      <DismissButton onClick={onDismiss} ariaLabel="Dismiss guided flow prompt" />
    </motion.div>
  )
}

const containerStyle: React.CSSProperties = {
  display:        'flex',
  alignItems:     'center',
  justifyContent: 'space-between',
  gap:            'var(--space-4)',
  marginTop:      'var(--space-6)',
  padding:        'var(--space-3) var(--space-4)',
  border:         '1px solid var(--color-border)',
  borderRadius:   'var(--radius-sm)',
  background:     'rgba(255, 255, 255, 0.03)',
}

const textStyle: React.CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize:   'var(--text-sm)',
  color:      'var(--color-text-secondary)',
}

const linkStyle: React.CSSProperties = {
  background:  'transparent',
  border:      'none',
  padding:     0,
  fontFamily:  'var(--font-sans)',
  fontSize:    'var(--text-sm)',
  color:       'var(--color-accent)',
  cursor:      'pointer',
  textDecoration: 'underline',
}