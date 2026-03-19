import { motion } from 'framer-motion'
import { GlassPanel, SectionHeading, Tag } from '@/core/design-system/components'
import { useReducedMotion } from '@/core/hooks/useReducedMotion'
import { zoneEntryVariants } from '@/core/utils/animationVariants'
import type { Skill, SkillType } from '@/core/types/content'

interface GraphListFallbackProps {
  skills: Skill[]
}

const TYPE_ORDER: SkillType[] = ['language', 'concept', 'domain']

const TYPE_LABELS: Record<SkillType, string> = {
  language: 'Languages',
  concept:  'Concepts',
  domain:   'Domains',
}

const DEPTH_LABELS: Record<string, string> = {
  familiar: 'Familiar',
  advanced: 'Advanced',
  expert:   'Expert',
}

/**
 * Text-based skill list for Recruiter and Safe modes.
 * Fills the full zone area (already offset from HUD by ZonePlane).
 * Scrollable vertically when content overflows.
 */
export default function GraphListFallback({ skills }: GraphListFallbackProps) {
  const reducedMotion = useReducedMotion()

  const grouped: Record<SkillType, Skill[]> = { language: [], concept: [], domain: [] }
  for (const skill of skills) grouped[skill.type].push(skill)

  const motionProps = reducedMotion
    ? {}
    : {
        variants: zoneEntryVariants,
        initial: 'initial' as const,
        animate: 'animate' as const,
        exit:    'exit'    as const,
      }

  return (
    <motion.div style={outerStyle} {...motionProps}>
      {/* Scrollable inner container — does NOT start at 0 because ZonePlane already offsets */}
      <div style={scrollAreaStyle}>
        <div style={contentStyle}>
          <GlassPanel>
            <div style={panelInnerStyle}>
              {TYPE_ORDER.map((type) => {
                const group = grouped[type]
                if (group.length === 0) return null
                return (
                  <div key={type} style={sectionStyle}>
                    <SectionHeading>{TYPE_LABELS[type]}</SectionHeading>
                    <ul style={listStyle} aria-label={`${TYPE_LABELS[type]} list`}>
                      {group.map((skill) => (
                        <li key={skill.id} style={entryStyle}>
                          <span style={labelStyle}>{skill.label}</span>
                          <Tag label={DEPTH_LABELS[skill.depth] ?? skill.depth} />
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              })}
            </div>
          </GlassPanel>
        </div>
      </div>
    </motion.div>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

// Fills the zone area (zone area already starts below HUD)
const outerStyle: React.CSSProperties = {
  width:    '100%',
  height:   '100%',
  overflow: 'hidden',
}

// Scrollable — allows content taller than the zone to scroll
const scrollAreaStyle: React.CSSProperties = {
  width:     '100%',
  height:    '100%',
  overflowY: 'auto',
  padding:   'var(--space-6) var(--space-4)',
}

// Centers content with a max-width
const contentStyle: React.CSSProperties = {
  maxWidth: '640px',
  margin:   '0 auto',
}

const panelInnerStyle: React.CSSProperties = {
  padding: 'var(--space-6)',
}

const sectionStyle: React.CSSProperties = {
  marginBottom: 'var(--space-6)',
}

const listStyle: React.CSSProperties = {
  listStyle:     'none',
  margin:        0,
  padding:       0,
  marginTop:     'var(--space-3)',
  display:       'flex',
  flexDirection: 'column',
  gap:           'var(--space-2)',
}

const entryStyle: React.CSSProperties = {
  display:        'flex',
  alignItems:     'center',
  justifyContent: 'space-between',
  padding:        'var(--space-2) var(--space-3)',
  borderRadius:   'var(--radius-sm)',
  background:     'rgba(255,255,255,0.02)',
}

const labelStyle: React.CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize:   'var(--text-sm)',
  color:      'var(--color-text-primary)',
}