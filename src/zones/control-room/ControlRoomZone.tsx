import { motion, AnimatePresence } from 'framer-motion'
import { GlassPanel } from '@/core/design-system/components'
import { useMode } from '@/core/hooks/useMode'
import { useMeta } from '@/core/hooks/useContent'
import { useStore } from '@/core/hooks/useStore'
import { useReducedMotion } from '@/core/hooks/useReducedMotion'
import { zoneEntryVariants } from '@/core/utils/animationVariants'
import { SystemIdentity } from './components/SystemIdentity'
import { StatusBadge } from './components/StatusBadge'
import { CtaButtons } from './components/CtaButtons'
import { MetricsGrid } from './components/MetricsGrid'
import { GuidedFlowPrompt } from './components/GuidedFlowPrompt'

export default function ControlRoomZone() {
  const { capabilities } = useMode()
  const meta              = useMeta()
  const reducedMotion     = useReducedMotion()
  const guidedFlowDismissed = useStore((s) => s.guidedFlowDismissed)
  const dismissGuidedFlow   = useStore((s) => s.dismissGuidedFlow)

  // ── Skeleton: content not yet loaded ────────────────────────────────────────
  if (meta === null) {
    return (
      <div style={wrapperStyle}>
        <GlassPanel elevated bordered>
          <div style={panelInnerStyle} />
        </GlassPanel>
      </div>
    )
  }

  const motionProps = reducedMotion || !capabilities.animationsEnabled
    ? {}
    : {
        variants:  zoneEntryVariants,
        initial:   'initial' as const,
        animate:   'animate' as const,
        exit:      'exit'    as const,
      }

  return (
    <motion.div style={wrapperStyle} {...motionProps}>
      <GlassPanel elevated bordered>
        <div style={panelInnerStyle}>
          {/* Identity block */}
          <SystemIdentity meta={meta} />

          {/* Status badge */}
          <StatusBadge version={meta.version} />

          {/* MetricsGrid */}
          <MetricsGrid metrics={meta.metrics} />

          {/* CtaButtons */}
          <CtaButtons />

          {/* Guided flow prompt */}
          <AnimatePresence>
            {!guidedFlowDismissed && (
              <GuidedFlowPrompt onDismiss={dismissGuidedFlow} />
            )}
          </AnimatePresence>
        </div>
      </GlassPanel>
    </motion.div>
  )
}

// ── Shared layout styles ───────────────────────────────────────────────────────

const wrapperStyle: React.CSSProperties = {
  width:          '100%',
  height:         '100%',
  display:        'flex',
  alignItems:     'center',
  justifyContent: 'center',
  padding:        'var(--space-8)',
  boxSizing:      'border-box',
}

const panelInnerStyle: React.CSSProperties = {
  padding: 'var(--space-8)',
  minWidth: '320px',
}