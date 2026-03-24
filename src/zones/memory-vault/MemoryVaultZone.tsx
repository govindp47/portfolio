import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { GlassPanel } from '@/core/design-system/components'
import { BodyText } from '@/core/design-system/typography'
import { useMode } from '@/core/hooks/useMode'
import { useProjects } from '@/core/hooks/useContent'
import { useReducedMotion } from '@/core/hooks/useReducedMotion'
import { zoneEntryVariants } from '@/core/utils/animationVariants'
import { useStore } from '@/core/hooks/useStore'
import { ProjectCard } from './components/ProjectCard'
import { useProjectAccordion } from './hooks/useProjectAccordion'

// Stagger container: fires on initial mount only.
// Using a stable variants object prevents re-triggering on accordion changes.
const listContainerVariants = {
  hidden:  {},
  visible: {
    transition: {
      staggerChildren: 0.04,
    },
  },
}

export default function MemoryVaultZone() {
  const rawProjects   = useProjects()
  const { activeMode, capabilities } = useMode()
  const reducedMotion = useReducedMotion()
  const { expandedProjectId, toggleProject } = useProjectAccordion()

  const zoneEntryHint    = useStore((s) => s.zoneEntryHint)
  const setZoneEntryHint = useStore((s) => s.setZoneEntryHint)
  const [highlightedSkillId, setHighlightedSkillId] = useState<string | null>(null)

  // Read and immediately clear the zone entry hint on mount
  useEffect(() => {
    const hint = zoneEntryHint
    if (hint && typeof hint['filterSkillId'] === 'string') {
      setHighlightedSkillId(hint['filterSkillId'] as string)
      setZoneEntryHint(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const projects = [...rawProjects].sort((a, b) => a.displayOrder - b.displayOrder)

  const isDeepMode = activeMode === 'deep'

  const zoneMotionProps = reducedMotion || !capabilities.animationsEnabled
    ? {}
    : {
        variants: zoneEntryVariants,
        initial:  'initial' as const,
        animate:  'animate'  as const,
        exit:     'exit'     as const,
      }

  if (projects.length === 0) {
    return (
      <motion.div style={outerStyle} {...zoneMotionProps}>
        <GlassPanel>
          <div style={{ padding: 'var(--space-6)' }}>
            <BodyText muted>No project data available</BodyText>
          </div>
        </GlassPanel>
      </motion.div>
    )
  }

  const listMotionProps = reducedMotion
    ? {}
    : {
        variants: listContainerVariants,
        initial:  'hidden'  as const,
        animate:  'visible' as const,
      }

  return (
    <motion.div style={outerStyle} {...zoneMotionProps}>
      <div style={scrollAreaStyle}>
        <div style={contentStyle}>
          <motion.div style={listStyle} {...listMotionProps}>
            {projects.map((project) => {
              const isHighlighted = highlightedSkillId !== null &&
                project.skillRefs.includes(highlightedSkillId)
              return (
                <div
                  key={project.id}
                  style={isHighlighted ? highlightedCardWrapperStyle : undefined}
                >
                  <ProjectCard
                    project={project}
                    isExpanded={isDeepMode || expandedProjectId === project.id}
                    onToggle={() => toggleProject(project.id)}
                    showDismiss={!isDeepMode}
                  />
                </div>
              )
            })}
          </motion.div>
        </div>
      </div>
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
  padding:   'var(--space-6) var(--space-4)',
  boxSizing: 'border-box',
}

const contentStyle: React.CSSProperties = {
  maxWidth: '760px',
  margin:   '0 auto',
}

const listStyle: React.CSSProperties = {
  display:       'flex',
  flexDirection: 'column',
  gap:           'var(--space-4)',
}

const highlightedCardWrapperStyle: React.CSSProperties = {
  outline:      '1px solid var(--color-accent)',
  borderRadius: 'var(--radius-md)',
  boxShadow:    'var(--glow-accent)',
}