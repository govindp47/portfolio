import { MonoText } from '@/core/design-system/typography'

interface ExplorationLevelProps {
  level:          number
  unlockedCount:  number
  totalZones:     number
}

export function ExplorationLevel({ level, unlockedCount, totalZones }: ExplorationLevelProps) {
  return (
    <div style={containerStyle}>
      <MonoText size="xs">
        <span style={levelStyle}>EXPLORATION LVL {level}</span>
      </MonoText>
      <MonoText size="xs">
        <span style={progressStyle}>{unlockedCount} / {totalZones} zones</span>
      </MonoText>
    </div>
  )
}

const containerStyle: React.CSSProperties = {
  display:       'flex',
  flexDirection: 'column',
  alignItems:    'flex-end',
  gap:           '2px',
}

const levelStyle: React.CSSProperties = {
  color:         'var(--color-accent)',
  letterSpacing: '0.06em',
}

const progressStyle: React.CSSProperties = {
  color: 'var(--color-text-muted)',
}