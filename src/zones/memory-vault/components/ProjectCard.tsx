import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GlassPanel, SectionHeading, Tag } from '@/core/design-system/components'
import { BodyText } from '@/core/design-system/typography'
import type { Project } from '@/core/types/content'
import { useArchitectureToggle } from '../hooks/useArchitectureToggle'
import { ProjectExpanded } from './ProjectExpanded'

interface ProjectCardProps {
  project:    Project
  isExpanded: boolean
  onToggle:   () => void
  showDismiss: boolean
}

const cardVariants = {
  hidden:  { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } },
}

function ProjectCardInner({ project, isExpanded, onToggle, showDismiss }: ProjectCardProps) {
  const { architectureVisible, toggleArchitecture } = useArchitectureToggle(isExpanded)

  return (
    <motion.div
      layout
      layoutId={project.id}
      variants={cardVariants}
      style={{ cursor: isExpanded ? 'default' : 'pointer' }}
      onClick={!isExpanded ? onToggle : undefined}
    >
      <GlassPanel>
        <div style={innerStyle}>
          {/* Collapsed content — always visible */}
          <SectionHeading>{project.title}</SectionHeading>

          <BodyText muted>{project.problem}</BodyText>

          <div style={tagRowStyle}>
            {project.stack.map((s) => (
              <Tag key={s} label={s} />
            ))}
          </div>

          <BodyText>
            <span style={outcomeStyle}>{project.outcome}</span>
          </BodyText>

          {/* Expanded content */}
          <AnimatePresence>
            {isExpanded && (
              <ProjectExpanded
                key="expanded"
                project={project}
                architectureVisible={architectureVisible}
                onToggleArchitecture={toggleArchitecture}
                onDismiss={onToggle}
                showDismiss={showDismiss}
              />
            )}
          </AnimatePresence>
        </div>
      </GlassPanel>
    </motion.div>
  )
}

export const ProjectCard = React.memo(ProjectCardInner)
ProjectCard.displayName = 'ProjectCard'

const innerStyle: React.CSSProperties = {
  padding:       'var(--space-5)',
  display:       'flex',
  flexDirection: 'column',
  gap:           'var(--space-3)',
}

const tagRowStyle: React.CSSProperties = {
  display:  'flex',
  flexWrap: 'wrap',
  gap:      'var(--space-2)',
}

const outcomeStyle: React.CSSProperties = {
  color:      'var(--color-accent)',
  fontFamily: 'var(--font-mono)',
  fontSize:   'var(--text-sm)',
}