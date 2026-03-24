import { motion, AnimatePresence } from 'framer-motion'
import { DismissButton } from '@/core/design-system/components'
import { BodyText } from '@/core/design-system/typography'
import { useReducedMotion } from '@/core/hooks/useReducedMotion'
import type { Project } from '@/core/types/content'

interface ProjectExpandedProps {
  project:              Project
  architectureVisible:  boolean
  onToggleArchitecture: () => void
  onDismiss:            () => void
  showDismiss:          boolean
}

export function ProjectExpanded({
  project,
  architectureVisible,
  onToggleArchitecture,
  onDismiss,
  showDismiss,
}: ProjectExpandedProps) {
  const reducedMotion = useReducedMotion()

  const contentMotion = reducedMotion
    ? {}
    : {
        initial: { opacity: 0, y: 8 },
        animate: { opacity: 1, y: 0, transition: { duration: 0.2 } },
        exit:    { opacity: 0,        transition: { duration: 0.15 } },
      }

  const archContentMotion = reducedMotion
    ? {}
    : {
        initial: { opacity: 0, y: 6 },
        animate: { opacity: 1, y: 0, transition: { duration: 0.18 } },
        exit:    { opacity: 0,        transition: { duration: 0.12 } },
      }

  return (
    <motion.div {...contentMotion} style={expandedStyle}>

      {showDismiss && (
        <div style={dismissRowStyle}>
          <DismissButton onClick={onDismiss} ariaLabel="Collapse project card" />
        </div>
      )}

      {/* Full problem */}
      <div style={sectionStyle}>
        <span style={labelStyle}>Problem</span>
        <BodyText>{project.problemFull}</BodyText>
      </div>

      {/* Constraints */}
      {project.constraints.length > 0 && (
        <div style={sectionStyle}>
          <span style={labelStyle}>Constraints</span>
          <ul style={listStyle}>
            {project.constraints.map((c, i) => (
              <li key={i} style={listItemStyle}><BodyText>{c}</BodyText></li>
            ))}
          </ul>
        </div>
      )}

      {/* Tradeoffs */}
      {project.tradeoffs.length > 0 && (
        <div style={sectionStyle}>
          <span style={labelStyle}>Tradeoffs</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {project.tradeoffs.map((t, i) => (
              <div key={i} style={tradeoffBlockStyle}>
                <div style={tradeoffRowStyle}>
                  <span style={tradeoffKeyStyle}>Decision</span>
                  <BodyText>{t.decision}</BodyText>
                </div>
                <div style={tradeoffRowStyle}>
                  <span style={tradeoffKeyStyle}>Rationale</span>
                  <BodyText muted>{t.rationale}</BodyText>
                </div>
                <div style={tradeoffRowStyle}>
                  <span style={tradeoffKeyStyle}>Trade-off</span>
                  <BodyText muted>{t.consequence}</BodyText>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Architecture toggle */}
      <div style={sectionStyle}>
        <button onClick={onToggleArchitecture} style={archToggleStyle}>
          {architectureVisible ? 'Architecture ▴' : 'Architecture ▾'}
        </button>
        <AnimatePresence>
          {architectureVisible && (
            <motion.div {...archContentMotion} style={{ marginTop: 'var(--space-3)' }}>
              <BodyText muted>{project.architecture}</BodyText>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Full outcome */}
      <div style={sectionStyle}>
        <span style={labelStyle}>Outcome</span>
        <BodyText>{project.outcomeFull}</BodyText>
      </div>

      {/* Demo link */}
      {project.demoUrl !== null && (
        <div>
          <a
            href={project.demoUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={demoLinkStyle}
          >
            View Demo →
          </a>
        </div>
      )}

    </motion.div>
  )
}

const expandedStyle: React.CSSProperties = {
  display:       'flex',
  flexDirection: 'column',
  gap:           'var(--space-4)',
  paddingTop:    'var(--space-2)',
  borderTop:     '1px solid var(--color-border)',
  marginTop:     'var(--space-2)',
}

const dismissRowStyle: React.CSSProperties = {
  display:        'flex',
  justifyContent: 'flex-end',
}

const sectionStyle: React.CSSProperties = {
  display:       'flex',
  flexDirection: 'column',
  gap:           'var(--space-2)',
}

const labelStyle: React.CSSProperties = {
  fontFamily:    'var(--font-mono)',
  fontSize:      'var(--text-xs)',
  color:         'var(--color-accent)',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
}

const listStyle: React.CSSProperties = {
  listStyle:  'none',
  margin:     0,
  padding:    0,
  display:    'flex',
  flexDirection: 'column',
  gap:        'var(--space-1)',
}

const listItemStyle: React.CSSProperties = {
  paddingLeft: 'var(--space-3)',
  borderLeft:  '2px solid var(--color-border)',
}

const tradeoffBlockStyle: React.CSSProperties = {
  display:       'flex',
  flexDirection: 'column',
  gap:           'var(--space-2)',
  padding:       'var(--space-3)',
  background:    'rgba(255,255,255,0.02)',
  borderRadius:  'var(--radius-sm)',
  border:        '1px solid var(--color-border)',
}

const tradeoffRowStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-1)',
}

const tradeoffKeyStyle: React.CSSProperties = {
  fontFamily:    'var(--font-mono)',
  fontSize:      'var(--text-xs)',
  color:         'var(--color-text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
}

const archToggleStyle: React.CSSProperties = {
  background:    'transparent',
  border:        '1px solid var(--color-border)',
  borderRadius:  'var(--radius-sm)',
  color:         'var(--color-text-secondary)',
  fontFamily:    'var(--font-mono)',
  fontSize:      'var(--text-xs)',
  padding:       'var(--space-1) var(--space-3)',
  cursor:        'pointer',
  letterSpacing: '0.06em',
  alignSelf:     'flex-start',
}

const demoLinkStyle: React.CSSProperties = {
  color:          'var(--color-accent)',
  fontFamily:     'var(--font-sans)',
  fontSize:       'var(--text-sm)',
  textDecoration: 'underline',
}