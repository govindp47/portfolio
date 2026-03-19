import { motion } from 'framer-motion'
import { GlassPanel } from '@/core/design-system/components'
import { useMode } from '@/core/hooks/useMode'
import { useSkills, useEdges } from '@/core/hooks/useContent'
import { useReducedMotion } from '@/core/hooks/useReducedMotion'
import { zoneEntryVariants } from '@/core/utils/animationVariants'
import GraphCanvas from './components/GraphCanvas'
import GraphListFallback from './components/GraphListFallback'

/**
 * NeuralGraphZone root.
 *
 * Explorer/Deep mode → full SVG force graph (GraphCanvas)
 * Recruiter/Safe mode → scrollable text list (GraphListFallback)
 *
 * The wrapper fills 100% of the ZonePlane area (already offset below HUD).
 * GraphCanvas gets the full area; its SVG fills it and D3 reads real dimensions.
 */
export default function NeuralGraphZone() {
  const { activeMode, capabilities } = useMode()
  const skills        = useSkills()
  const edges         = useEdges()
  const reducedMotion = useReducedMotion()

  const useFallback =
    capabilities.animationLevel === 'none' ||
    activeMode === 'recruiter' ||
    activeMode === 'safe'

  const motionProps = reducedMotion
    ? {}
    : {
        variants: zoneEntryVariants,
        initial:  'initial' as const,
        animate:  'animate' as const,
        exit:     'exit'    as const,
      }

  if (!useFallback && skills.length === 0) {
    return (
      <motion.div style={wrapperStyle} {...motionProps}>
        <GlassPanel>
          <div style={emptyStyle}>No skill data available</div>
        </GlassPanel>
      </motion.div>
    )
  }

  return (
    <motion.div style={wrapperStyle} {...motionProps}>
      {useFallback
        ? <GraphListFallback skills={skills} />
        : <GraphCanvas skills={skills} edges={edges} />
      }
    </motion.div>
  )
}

const wrapperStyle: React.CSSProperties = {
  width:    '100%',
  height:   '100%',
  overflow: 'hidden',
}

const emptyStyle: React.CSSProperties = {
  padding:    'var(--space-6)',
  color:      'var(--color-text-muted)',
  fontFamily: 'var(--font-mono)',
  fontSize:   'var(--text-sm)',
}