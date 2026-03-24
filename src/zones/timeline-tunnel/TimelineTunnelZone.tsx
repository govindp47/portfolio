import { motion } from 'framer-motion'
import { GlassPanel } from '@/core/design-system/components'
import { BodyText } from '@/core/design-system/typography'
import { useMode } from '@/core/hooks/useMode'
import { useTimeline, useSkills } from '@/core/hooks/useContent'
import { useReducedMotion } from '@/core/hooks/useReducedMotion'
import { zoneEntryVariants } from '@/core/utils/animationVariants'
import { TimelineEntry } from './components/TimelineEntry'
import { useTimelineExpansion } from './hooks/useTimelineExpansion'

const CARD_WIDTH = 320

export default function TimelineTunnelZone() {
  const timeline      = useTimeline()
  const skills        = useSkills()
  const { activeMode, capabilities } = useMode()
  const reducedMotion = useReducedMotion()
  const { expandedEntryId, toggleEntry } = useTimelineExpansion()

  const isHorizontal = activeMode === 'explorer' || activeMode === 'deep'

  const motionProps = reducedMotion || !capabilities.animationsEnabled
    ? {}
    : {
        variants: zoneEntryVariants,
        initial:  'initial' as const,
        animate:  'animate' as const,
        exit:     'exit'    as const,
      }

  if (timeline.length === 0) {
    return (
      <motion.div style={outerStyle} {...motionProps}>
        <div style={scrollAreaStyle}>
          <GlassPanel>
            <div style={{ padding: 'var(--space-6)' }}>
              <BodyText muted>No timeline data available</BodyText>
            </div>
          </GlassPanel>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div style={outerStyle} {...motionProps}>
      {isHorizontal ? (
        /* Horizontal scroll — Explorer / Deep */
        <div
          data-testid="horizontal-scroll"
          style={{
            width:           '100%',
            height:          '100%',
            overflowX:       'auto',
            overflowY:       'hidden',
            display:         'flex',
            flexDirection:   'row',
            gap:             'var(--space-6)',
            padding:         'var(--space-6)',
            scrollSnapType:  'x mandatory',
            boxSizing:       'border-box',
            alignItems:      'flex-start',
          }}
        >
          {timeline.map((entry) => (
            <TimelineEntry
              key={entry.id}
              entry={entry}
              isExpanded={expandedEntryId === entry.id}
              onToggle={() => toggleEntry(entry.id)}
              skills={skills}
              cardWidth={CARD_WIDTH}
            />
          ))}
        </div>
      ) : (
        /* Vertical stack — Recruiter / Safe */
        <div
          data-testid="vertical-stack"
          style={{
            width:     '100%',
            height:    '100%',
            overflowY: 'auto',
            padding:   'var(--space-6) var(--space-4)',
            boxSizing: 'border-box',
          }}
        >
          <div style={{ maxWidth: '640px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {timeline.map((entry) => (
              <TimelineEntry
                key={entry.id}
                entry={entry}
                isExpanded={expandedEntryId === entry.id}
                onToggle={() => toggleEntry(entry.id)}
                skills={skills}
              />
            ))}
          </div>
        </div>
      )}
    </motion.div>
  )
}

const outerStyle: React.CSSProperties = {
  width:    '100%',
  height:   '100%',
  overflow: 'hidden',
}

const scrollAreaStyle: React.CSSProperties = {
  width:     '100%',
  height:    '100%',
  overflowY: 'auto',
  padding:   'var(--space-6)',
  boxSizing: 'border-box' as const,
}