import { motion } from 'framer-motion'
import { Tag } from '@/core/design-system/components'
import { BodyText } from '@/core/design-system/typography'
import { resolveSkillLabel } from '@/core/utils/idResolver'
import { useReducedMotion } from '@/core/hooks/useReducedMotion'
import type { TimelineEntry } from '@/core/types/content'
import type { Skill } from '@/core/types/content'

interface TimelineEntryExpandedProps {
  entry:  TimelineEntry
  skills: Skill[]
}

export function TimelineEntryExpanded({ entry, skills }: TimelineEntryExpandedProps) {
  const reducedMotion = useReducedMotion()

  const motionProps = reducedMotion
    ? {}
    : {
        initial: { opacity: 0, y: 8 },
        animate: { opacity: 1, y: 0, transition: { duration: 0.2 } },
        exit:    { opacity: 0,        transition: { duration: 0.15 } },
      }

  return (
    <motion.div {...motionProps} style={expandedStyle}>

      {/* Highlights */}
      {entry.highlights.length > 0 && (
        <div style={sectionStyle}>
          <span style={labelStyle}>Highlights</span>
          <ul style={listStyle}>
            {entry.highlights.map((h, i) => (
              <li key={i} style={listItemStyle}>
                <BodyText><span style={bodySecondaryStyle}>{h}</span></BodyText>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Impact */}
      {entry.impact.length > 0 && (
        <div style={sectionStyle}>
          <span style={labelStyle}>Impact</span>
          <ul style={listStyle}>
            {entry.impact.map((imp, i) => (
              <li key={i} style={listItemStyle}>
                <BodyText><span style={bodySecondaryStyle}>{imp}</span></BodyText>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Technologies */}
      {entry.technologies.length > 0 && (
        <div style={sectionStyle}>
          <span style={labelStyle}>Technologies</span>
          <div style={tagRowStyle}>
            {entry.technologies.map((techId) => {
              const label = resolveSkillLabel(techId, skills) ?? techId
              return <Tag key={techId} label={label} />
            })}
          </div>
        </div>
      )}

    </motion.div>
  )
}

const expandedStyle: React.CSSProperties = {
  display:       'flex',
  flexDirection: 'column',
  gap:           'var(--space-4)',
  paddingTop:    'var(--space-3)',
  borderTop:     '1px solid var(--color-border)',
  marginTop:     'var(--space-2)',
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
  textTransform: 'uppercase' as const,
  letterSpacing: '0.08em',
}

const listStyle: React.CSSProperties = {
  listStyle:     'none',
  margin:        0,
  padding:       0,
  display:       'flex',
  flexDirection: 'column' as const,
  gap:           'var(--space-2)',
}

const listItemStyle: React.CSSProperties = {
  paddingLeft: 'var(--space-3)',
  borderLeft:  '2px solid var(--color-border)',
}

const bodySecondaryStyle: React.CSSProperties = {
  color:    'var(--color-text-secondary)',
  fontSize: 'var(--text-sm)',
}

const tagRowStyle: React.CSSProperties = {
  display:  'flex',
  flexWrap: 'wrap' as const,
  gap:      'var(--space-2)',
}