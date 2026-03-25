import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GlassPanel } from '@/core/design-system/components'
import { BodyText } from '@/core/design-system/typography'
import { useReducedMotion } from '@/core/hooks/useReducedMotion'
import type { FeaturedProblem as FeaturedProblemType } from '@/core/types/content'

interface FeaturedProblemProps {
  problem: FeaturedProblemType
}

export function FeaturedProblem({ problem }: FeaturedProblemProps) {
  const [isVisible, setIsVisible] = useState(false)
  const reducedMotion = useReducedMotion()

  const contentMotion = reducedMotion
    ? {}
    : {
        initial: { opacity: 0, y: 8 },
        animate: { opacity: 1, y: 0, transition: { duration: 0.2 } },
        exit:    { opacity: 0,        transition: { duration: 0.15 } },
      }

  return (
    <div>
      <button
        onClick={() => setIsVisible((v) => !v)}
        style={toggleStyle}
        aria-expanded={isVisible}
        data-testid="deep-dive-toggle"
      >
        {isVisible ? 'Collapse ◀' : 'Deep Dive →'}
      </button>

      <AnimatePresence>
        {isVisible && (
          <motion.div {...contentMotion} style={{ marginTop: 'var(--space-4)' }}>
            <GlassPanel>
              <div style={innerStyle}>

                <div style={headerRowStyle}>
                  <span style={titleStyle}>{problem.title}</span>
                  <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                    <span style={metaChipStyle}>{problem.platform}</span>
                    <span style={{ ...metaChipStyle, color: difficultyColor(problem.difficulty) }}>
                      {problem.difficulty}
                    </span>
                  </div>
                </div>

                <FieldBlock label="Problem" value={problem.problemStatement} />
                <FieldBlock label="Approach" value={problem.approach} />
                <FieldBlock label="Key Insight" value={problem.keyInsight} />

                <div style={complexityRowStyle}>
                  <ComplexityChip label="Time" value={problem.complexity.time} />
                  <ComplexityChip label="Space" value={problem.complexity.space} />
                </div>

              </div>
            </GlassPanel>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function FieldBlock({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 'var(--space-1)' }}>
      <span style={fieldLabelStyle}>{label}</span>
      <BodyText><span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>{value}</span></BodyText>
    </div>
  )
}

function ComplexityChip({ label, value }: { label: string; value: string }) {
  return (
    <div style={chipStyle}>
      <span style={chipLabelStyle}>{label}</span>
      <span style={chipValueStyle}>{value}</span>
    </div>
  )
}

function difficultyColor(diff: string): string {
  if (diff === 'Easy') return 'rgba(57, 217, 138, 0.9)'
  if (diff === 'Hard') return 'rgba(255, 77, 109, 0.9)'
  return 'rgba(255, 189, 46, 0.9)'
}

const toggleStyle: React.CSSProperties = {
  background:   'transparent',
  border:       '1px solid var(--color-border)',
  borderRadius: 'var(--radius-sm)',
  color:        'var(--color-text-secondary)',
  fontFamily:   'var(--font-mono)',
  fontSize:     'var(--text-xs)',
  padding:      'var(--space-1) var(--space-3)',
  cursor:       'pointer',
  letterSpacing: '0.06em',
}

const innerStyle: React.CSSProperties = {
  padding:       'var(--space-5)',
  display:       'flex',
  flexDirection: 'column',
  gap:           'var(--space-4)',
}

const headerRowStyle: React.CSSProperties = {
  display:        'flex',
  alignItems:     'flex-start',
  justifyContent: 'space-between',
  gap:            'var(--space-4)',
  flexWrap:       'wrap' as const,
}

const titleStyle: React.CSSProperties = {
  fontFamily:  'var(--font-sans)',
  fontSize:    'var(--text-lg)',
  fontWeight:  'var(--font-weight-bold)',
  color:       'var(--color-text-primary)',
}

const metaChipStyle: React.CSSProperties = {
  fontFamily:  'var(--font-mono)',
  fontSize:    'var(--text-xs)',
  color:       'var(--color-text-muted)',
  padding:     '2px var(--space-2)',
  border:      '1px solid var(--color-border)',
  borderRadius: 'var(--radius-full)',
}

const fieldLabelStyle: React.CSSProperties = {
  fontFamily:    'var(--font-mono)',
  fontSize:      'var(--text-xs)',
  color:         'var(--color-accent)',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.08em',
}

const complexityRowStyle: React.CSSProperties = {
  display: 'flex',
  gap:     'var(--space-3)',
}

const chipStyle: React.CSSProperties = {
  display:       'flex',
  flexDirection: 'column' as const,
  gap:           '2px',
  padding:       'var(--space-2) var(--space-3)',
  background:    'rgba(255,255,255,0.03)',
  border:        '1px solid var(--color-border)',
  borderRadius:  'var(--radius-sm)',
}

const chipLabelStyle: React.CSSProperties = {
  fontFamily:    'var(--font-mono)',
  fontSize:      'var(--text-xs)',
  color:         'var(--color-text-muted)',
  textTransform: 'uppercase' as const,
}

const chipValueStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize:   'var(--text-sm)',
  color:      'var(--color-accent)',
}