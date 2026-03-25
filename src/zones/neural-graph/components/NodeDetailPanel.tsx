import { motion } from 'framer-motion'
import { GlassPanel, ActionButton, Tag, DismissButton, SectionHeading } from '@/core/design-system/components'
import { BodyText } from '@/core/design-system/typography'
import { useNavigate } from '@/core/hooks/useNavigate'
import { useReducedMotion } from '@/core/hooks/useReducedMotion'
import type { Skill } from '@/core/types/content'
import { useStore } from '@/core/hooks/useStore'

interface NodeDetailPanelProps {
  skill:          Skill | null
  projectCount:   number
  onClose:        () => void
  onQuizTrigger:  () => void
}

/**
 * Skill detail panel — absolutely positioned inside the GraphCanvas wrapper div.
 * The wrapper div already fills only the zone area (below the HUD), so
 * top: var(--space-4) is relative to the zone top, not the viewport top.
 */
export function NodeDetailPanel({
  skill,
  projectCount,
  onClose,
  onQuizTrigger,
}: NodeDetailPanelProps) {
  const { navigateTo } = useNavigate()
  const reducedMotion  = useReducedMotion()
  const setZoneEntryHint = useStore((s) => s.setZoneEntryHint)

  if (skill === null) return null

  const motionProps = reducedMotion
    ? {}
    : {
        initial: { opacity: 0, x: 12 },
        animate: { opacity: 1, x: 0,   transition: { duration: 0.2  } },
        exit:    { opacity: 0, x: 12,  transition: { duration: 0.15 } },
      }

  const depthLabel = skill.depth.charAt(0).toUpperCase() + skill.depth.slice(1)
  const typeLabel  = skill.type.charAt(0).toUpperCase()  + skill.type.slice(1)
  
  function handleProjectsClick() {
    setZoneEntryHint({ filterSkillId: skill!.id })
    navigateTo('memory-vault')
    onClose()
  }

  return (
    <motion.div
      {...motionProps}
      style={panelStyle}
      onClick={(e) => e.stopPropagation()}
    >
      <GlassPanel elevated bordered>
        <div style={innerStyle}>

          {/* Dismiss row */}
          <div style={dismissRowStyle}>
            <DismissButton onClick={onClose} ariaLabel="Close skill detail panel" />
          </div>

          {/* Title */}
          <SectionHeading>{skill.label}</SectionHeading>

          {/* Type + depth tags */}
          <div style={tagRowStyle}>
            <Tag label={typeLabel} />
            <Tag label={depthLabel} />
          </div>

          {/* Confidence */}
          <div style={rowStyle}>
            <span style={mutedLabel}>Confidence</span>
            <span style={accentValue}>{skill.confidence}%</span>
          </div>

          {/* Description */}
          <BodyText>
            <span style={descStyle}>{skill.description}</span>
          </BodyText>

          {/* Associated projects */}
          {projectCount > 0 && (
            <button onClick={handleProjectsClick} style={linkStyle}>
              {projectCount} associated project{projectCount !== 1 ? 's' : ''} →
            </button>
          )}

          {/* Quiz trigger */}
          <div style={{ paddingTop: 'var(--space-2)' }}>
            <ActionButton variant="secondary" onClick={onQuizTrigger}>
              Test this skill →
            </ActionButton>
          </div>

        </div>
      </GlassPanel>
    </motion.div>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

// Positioned inside GraphCanvas wrapper div (position: relative).
// top/right are relative to the zone area, which starts below the HUD.
const panelStyle: React.CSSProperties = {
  position:  'absolute',
  top:       'var(--space-4)',
  right:     'var(--space-4)',
  width:     '280px',
  maxHeight: 'calc(100% - 2rem)',
  overflowY: 'auto',
  zIndex:    5,
}

const innerStyle: React.CSSProperties = {
  padding:       'var(--space-4)',
  display:       'flex',
  flexDirection: 'column',
  gap:           'var(--space-3)',
}

const dismissRowStyle: React.CSSProperties = {
  display:        'flex',
  justifyContent: 'flex-end',
}

const tagRowStyle: React.CSSProperties = {
  display:  'flex',
  gap:      'var(--space-2)',
  flexWrap: 'wrap',
}

const rowStyle: React.CSSProperties = {
  display:    'flex',
  alignItems: 'center',
  gap:        'var(--space-2)',
}

const mutedLabel: React.CSSProperties = {
  color:       'var(--color-text-muted)',
  fontSize:    'var(--text-xs)',
  marginRight: 'var(--space-1)',
}

const accentValue: React.CSSProperties = {
  color:      'var(--color-accent)',
  fontFamily: 'var(--font-mono)',
  fontSize:   'var(--text-sm)',
}

const descStyle: React.CSSProperties = {
  color:    'var(--color-text-secondary)',
  fontSize: 'var(--text-sm)',
}

const linkStyle: React.CSSProperties = {
  background:     'transparent',
  border:         'none',
  padding:        0,
  fontFamily:     'var(--font-sans)',
  fontSize:       'var(--text-sm)',
  color:          'var(--color-accent)',
  cursor:         'pointer',
  textDecoration: 'underline',
  textAlign:      'left',
}