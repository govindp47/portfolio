import { useState } from 'react'
import { Tag } from '@/core/design-system/components'
import { BodyText } from '@/core/design-system/typography'
import type { SolvedPattern } from '@/core/types/content'

interface SolvedPatternsProps {
  patterns: SolvedPattern[]
}

export function SolvedPatterns({ patterns }: SolvedPatternsProps) {
  const [expandedPatternId, setExpandedPatternId] = useState<string | null>(null)

  function togglePattern(pattern: string) {
    setExpandedPatternId((prev) => (prev === pattern ? null : pattern))
  }

  return (
    <div style={containerStyle}>
      {patterns.map((p) => {
        const isExpanded = expandedPatternId === p.pattern
        return (
          <div key={p.pattern} style={itemStyle}>
            <button
              onClick={() => togglePattern(p.pattern)}
              style={patternButtonStyle}
              aria-expanded={isExpanded}
            >
              <span style={patternNameStyle}>{p.pattern}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <Tag label={`${p.count}`} />
                <span style={chevronStyle}>{isExpanded ? '▴' : '▾'}</span>
              </div>
            </button>

            {isExpanded && p.problemRefs.length > 0 && (
              <ul style={refListStyle} data-testid={`refs-${p.pattern}`}>
                {p.problemRefs.map((ref, i) => (
                  <li key={i} style={refItemStyle}>
                    <BodyText>
                      <span style={refStyle}>{ref}</span>
                    </BodyText>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )
      })}
    </div>
  )
}

const containerStyle: React.CSSProperties = {
  display:       'flex',
  flexDirection: 'column',
  gap:           'var(--space-2)',
}

const itemStyle: React.CSSProperties = {
  display:       'flex',
  flexDirection: 'column',
}

const patternButtonStyle: React.CSSProperties = {
  display:        'flex',
  alignItems:     'center',
  justifyContent: 'space-between',
  padding:        'var(--space-2) var(--space-3)',
  background:     'rgba(255,255,255,0.03)',
  border:         '1px solid var(--color-border)',
  borderRadius:   'var(--radius-sm)',
  cursor:         'pointer',
  width:          '100%',
}

const patternNameStyle: React.CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize:   'var(--text-sm)',
  color:      'var(--color-text-primary)',
}

const chevronStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize:   'var(--text-xs)',
  color:      'var(--color-text-muted)',
}

const refListStyle: React.CSSProperties = {
  listStyle:   'none',
  margin:      0,
  padding:     'var(--space-2) var(--space-3)',
  display:     'flex',
  flexDirection: 'column' as const,
  gap:         'var(--space-1)',
  background:  'rgba(255,255,255,0.02)',
  borderLeft:  '2px solid var(--color-border)',
  marginLeft:  'var(--space-3)',
}

const refItemStyle: React.CSSProperties = {
  paddingLeft: 'var(--space-2)',
}

const refStyle: React.CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize:   'var(--text-sm)',
  color:      'var(--color-text-secondary)',
}