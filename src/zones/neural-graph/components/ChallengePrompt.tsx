import { motion, AnimatePresence } from 'framer-motion'
import { DismissButton } from '@/core/design-system/components'
import { BodyText } from '@/core/design-system/typography'
import { useStore } from '@/core/hooks/useStore'
import { useReducedMotion } from '@/core/hooks/useReducedMotion'
import { selectIsGameActive } from '@/core/store/index'

interface ChallengePromptProps {
  challengeId: string
  message:     string
  onDismiss:   () => void
}

/**
 * ChallengePrompt — Neural Graph variant.
 * Positioned at the bottom of the zone content area.
 * Only rendered when the game layer is active (Explorer Mode).
 * Hidden permanently once dismissed within the session.
 */
export function ChallengePrompt({ challengeId, message, onDismiss }: ChallengePromptProps) {
  const isGameActive         = useStore(selectIsGameActive)
  const dismissedChallenges  = useStore((s) => s.dismissedChallenges)
  const reducedMotion        = useReducedMotion()

  if (!isGameActive || dismissedChallenges.includes(challengeId)) return null

  const motionProps = reducedMotion
    ? {}
    : {
        initial: { opacity: 0, y: 8 },
        animate: { opacity: 1, y: 0, transition: { duration: 0.25 } },
        exit:    { opacity: 0,        transition: { duration: 0.15 } },
      }

  return (
    <AnimatePresence>
      <motion.div
        key={challengeId}
        {...motionProps}
        style={containerStyle}
        role="note"
        aria-label="Challenge prompt"
        data-testid={`challenge-prompt-${challengeId}`}
      >
        <BodyText>
          <span style={messageStyle}>{message}</span>
        </BodyText>
        <DismissButton onClick={onDismiss} ariaLabel="Dismiss challenge prompt" />
      </motion.div>
    </AnimatePresence>
  )
}

const containerStyle: React.CSSProperties = {
  position:       'absolute',
  top:            'var(--space-4)',
  left:           'var(--space-4)',
  display:        'flex',
  alignItems:     'center',
  gap:            'var(--space-3)',
  padding:        'var(--space-2) var(--space-4)',
  background:     'rgba(10, 11, 15, 0.82)',
  border:         '1px solid var(--color-border)',
  borderRadius:   'var(--radius-md)',
  backdropFilter: 'blur(8px)',
  zIndex:         4,
  maxWidth:       '400px',
}

const messageStyle: React.CSSProperties = {
  fontSize:   'var(--text-sm)',
  color:      'var(--color-text-secondary)',
  whiteSpace: 'normal' as const,
}