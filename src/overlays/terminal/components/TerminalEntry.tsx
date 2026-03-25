import React from 'react'
import { MonoText } from '@/core/design-system/typography'
import type { TerminalEntry as TerminalEntryType } from '@/core/types/state'

interface TerminalEntryProps {
  entry: TerminalEntryType
}

function TerminalEntryInner({ entry }: TerminalEntryProps) {
  const lines = entry.content.split('\n')

  if (entry.type === 'input') {
    return (
      <div style={wrapperStyle}>
        <MonoText size="sm">
          <span style={{ color: 'var(--color-accent)', marginRight: 'var(--space-2)' }}>›</span>
          <span style={{ color: 'var(--color-text-primary)' }}>{entry.content}</span>
        </MonoText>
      </div>
    )
  }

  if (entry.type === 'error') {
    return (
      <div style={wrapperStyle}>
        {lines.map((line, i) => (
          <div key={i}>
            <MonoText size="sm">
              <span style={{ color: 'var(--color-error)' }}>{line}</span>
            </MonoText>
          </div>
        ))}
      </div>
    )
  }

  // output
  return (
    <div style={wrapperStyle}>
      {lines.map((line, i) => (
        <div key={i}>
          <MonoText size="sm">
            <span style={{ color: 'var(--color-text-secondary)' }}>{line || '\u00A0'}</span>
          </MonoText>
        </div>
      ))}
    </div>
  )
}

export const TerminalEntry = React.memo(TerminalEntryInner)
TerminalEntry.displayName = 'TerminalEntry'

const wrapperStyle: React.CSSProperties = {
  padding: 'var(--space-1) var(--space-4)',
}