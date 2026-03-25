import { motion } from 'framer-motion'
import { GlassPanel, SectionHeading } from '@/core/design-system/components'
import { BodyText } from '@/core/design-system/typography'
import { useMode } from '@/core/hooks/useMode'
import { useArena } from '@/core/hooks/useContent'
import { useReducedMotion } from '@/core/hooks/useReducedMotion'
import { zoneEntryVariants } from '@/core/utils/animationVariants'
import { PlatformRatings } from './components/PlatformRatings'
import { DifficultyChart } from './components/DifficultyChart'
import { SolvedPatterns } from './components/SolvedPatterns'
import { FeaturedProblem } from './components/FeaturedProblem'
import { CertificationGroups } from './components/CertificationGroups'

export default function ArenaZone() {
  const arena         = useArena()
  const { capabilities } = useMode()
  const reducedMotion = useReducedMotion()

  const motionProps = reducedMotion || !capabilities.animationsEnabled
    ? {}
    : {
        variants: zoneEntryVariants,
        initial:  'initial' as const,
        animate:  'animate'  as const,
        exit:     'exit'     as const,
      }

  if (arena === null) {
    return (
      <motion.div style={outerStyle} {...motionProps}>
        <div style={scrollStyle}>
          <GlassPanel>
            <div style={{ padding: 'var(--space-6)' }}>
              <BodyText muted>No arena data available</BodyText>
            </div>
          </GlassPanel>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div style={outerStyle} {...motionProps}>
      <div style={scrollStyle}>
        <div style={contentStyle}>

          {/* Platform Ratings */}
          <Section title="Platform Ratings">
            <PlatformRatings platforms={arena.platforms} />
          </Section>

          {/* Difficulty Breakdown */}
          <Section title="Difficulty Breakdown">
            <DifficultyChart bands={arena.difficultyBreakdown} />
          </Section>

          {/* Solved Patterns */}
          <Section title="Problem Patterns">
            <SolvedPatterns patterns={arena.patterns} />
          </Section>

          {/* Featured Problem */}
          <Section title="Featured Problem">
            <FeaturedProblem problem={arena.featuredProblem} />
          </Section>

          {/* Certifications */}
          <Section title="Certifications">
            <CertificationGroups groups={arena.certifications} />
          </Section>

        </div>
      </div>
    </motion.div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <GlassPanel>
      <div style={sectionInnerStyle}>
        <SectionHeading>{title}</SectionHeading>
        <div style={{ marginTop: 'var(--space-4)' }}>{children}</div>
      </div>
    </GlassPanel>
  )
}

const outerStyle: React.CSSProperties = {
  width:    '100%',
  height:   '100%',
  overflow: 'hidden',
}

const scrollStyle: React.CSSProperties = {
  width:     '100%',
  height:    '100%',
  overflowY: 'auto',
  padding:   'var(--space-6) var(--space-4)',
  boxSizing: 'border-box' as const,
}

const contentStyle: React.CSSProperties = {
  maxWidth:      '720px',
  margin:        '0 auto',
  display:       'flex',
  flexDirection: 'column',
  gap:           'var(--space-6)',
}

const sectionInnerStyle: React.CSSProperties = {
  padding: 'var(--space-5)',
}