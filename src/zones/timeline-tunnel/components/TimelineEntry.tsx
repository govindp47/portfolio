import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GlassPanel, Tag } from '@/core/design-system/components'
import { BodyText } from '@/core/design-system/typography'
import type { TimelineEntry as TimelineEntryType } from '@/core/types/content'
import type { Skill } from '@/core/types/content'
import { TimelineEntryExpanded } from './TimelineEntryExpanded'

interface TimelineEntryProps {
  entry:      TimelineEntryType
  isExpanded: boolean
  onToggle:   () => void
  skills:     Skill[]
  /** Fixed card width for horizontal scroll layout; undefined = auto in vertical */
  cardWidth?: number
}

const TYPE_LABEL: Record<string, string> = {
  work:      'Work',
  education: 'Education',
}

function formatEndDate(endDate: string | null, isCurrent: boolean): string {
  if (isCurrent) return 'Present'
  if (!endDate) return ''
  // Show YYYY-MM from ISO date
  return endDate.slice(0, 7)
}

function TimelineEntryInner({ entry, isExpanded, onToggle, skills, cardWidth }: TimelineEntryProps) {
  return (
    <motion.div
      layout
      layoutId={entry.id}
      onClick={!isExpanded ? onToggle : undefined}
      style={{
        cursor:     isExpanded ? 'default' : 'pointer',
        flexShrink: 0,
        width:      cardWidth !== undefined ? `${cardWidth}px` : 'auto',
        scrollSnapAlign: cardWidth !== undefined ? 'start' : undefined,
      }}
    >
      <GlassPanel>
        <div style={innerStyle}>

          {/* Type badge */}
          <div style={badgeRowStyle}>
            <Tag label={TYPE_LABEL[entry.type] ?? entry.type} />
          </div>

          {/* Organization */}
          <div style={orgStyle}>{entry.organization}</div>

          {/* Role */}
          <BodyText>
            <span style={roleStyle}>{entry.role}</span>
          </BodyText>

          {/* Duration + date range */}
          <div style={metaStyle}>
            <span style={durationStyle}>{entry.duration}</span>
            {entry.startDate && (
              <span style={dateRangeStyle}>
                {entry.startDate.slice(0, 7)}
                {' — '}
                {formatEndDate(entry.endDate, entry.isCurrent)}
              </span>
            )}
          </div>

          {/* Expanded content */}
          <AnimatePresence>
            {isExpanded && (
              <TimelineEntryExpanded
                key="expanded"
                entry={entry}
                skills={skills}
              />
            )}
          </AnimatePresence>

          {/* Collapse affordance when expanded */}
          {isExpanded && (
            <button onClick={onToggle} style={collapseStyle}>
              Collapse ▴
            </button>
          )}

        </div>
      </GlassPanel>
    </motion.div>
  )
}

export const TimelineEntry = React.memo(TimelineEntryInner)
TimelineEntry.displayName = 'TimelineEntry'

const innerStyle: React.CSSProperties = {
  padding:       'var(--space-4)',
  display:       'flex',
  flexDirection: 'column',
  gap:           'var(--space-2)',
}

const badgeRowStyle: React.CSSProperties = {
  display: 'flex',
}

const orgStyle: React.CSSProperties = {
  fontFamily:  'var(--font-sans)',
  fontSize:    'var(--text-base)',
  fontWeight:  'var(--font-weight-bold)',
  color:       'var(--color-text-primary)',
}

const roleStyle: React.CSSProperties = {
  color:    'var(--color-text-secondary)',
  fontSize: 'var(--text-sm)',
}

const metaStyle: React.CSSProperties = {
  display:    'flex',
  gap:        'var(--space-3)',
  alignItems: 'center',
  flexWrap:   'wrap' as const,
}

const durationStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize:   'var(--text-xs)',
  color:      'var(--color-accent)',
}

const dateRangeStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize:   'var(--text-xs)',
  color:      'var(--color-text-muted)',
}

const collapseStyle: React.CSSProperties = {
  background:    'transparent',
  border:        '1px solid var(--color-border)',
  borderRadius:  'var(--radius-sm)',
  color:         'var(--color-text-muted)',
  fontFamily:    'var(--font-mono)',
  fontSize:      'var(--text-xs)',
  padding:       'var(--space-1) var(--space-2)',
  cursor:        'pointer',
  alignSelf:     'flex-start',
  marginTop:     'var(--space-2)',
}