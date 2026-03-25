import { useState, useRef } from 'react'
import type { DifficultyBand } from '@/core/types/content'

interface DifficultyChartProps {
  bands: DifficultyBand[]
}

const BAND_COLORS: Record<string, string> = {
  Easy:   'rgba(57, 217, 138, 0.65)',
  Medium: 'rgba(255, 189, 46, 0.65)',
  Hard:   'rgba(255, 77, 109, 0.65)',
}

function BandRow({ band }: { band: DifficultyBand }) {
  const [tooltipVisible, setTooltipVisible] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleMouseEnter() {
    timerRef.current = setTimeout(() => setTooltipVisible(true), 200)
  }
  function handleMouseLeave() {
    if (timerRef.current) clearTimeout(timerRef.current)
    setTooltipVisible(false)
  }

  const barColor = BAND_COLORS[band.label] ?? 'rgba(0, 245, 196, 0.5)'

  return (
    <div style={rowStyle} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <div style={labelColStyle}>
        <span style={bandLabelStyle}>{band.label}</span>
      </div>
      <div style={barTrackStyle}>
        <div
          data-testid={`bar-${band.label}`}
          style={{
            ...barFillStyle,
            width:      `${band.percentage}%`,
            background: barColor,
          }}
        />
      </div>
      <div style={pctColStyle}>
        <span style={pctStyle}>{band.percentage}%</span>
      </div>
      {tooltipVisible && (
        <div style={tooltipStyle} data-testid={`tooltip-${band.label}`}>
          {band.count} problems
        </div>
      )}
    </div>
  )
}

export function DifficultyChart({ bands }: DifficultyChartProps) {
  return (
    <div style={containerStyle}>
      {bands.map((band) => (
        <BandRow key={band.label} band={band} />
      ))}
    </div>
  )
}

const containerStyle: React.CSSProperties = {
  display:       'flex',
  flexDirection: 'column',
  gap:           'var(--space-3)',
}

const rowStyle: React.CSSProperties = {
  position:   'relative',
  display:    'flex',
  alignItems: 'center',
  gap:        'var(--space-3)',
}

const labelColStyle: React.CSSProperties = {
  width:     '64px',
  flexShrink: 0,
}

const bandLabelStyle: React.CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize:   'var(--text-sm)',
  color:      'var(--color-text-secondary)',
}

const barTrackStyle: React.CSSProperties = {
  flex:         1,
  height:       '10px',
  background:   'rgba(255,255,255,0.06)',
  borderRadius: 'var(--radius-full)',
  overflow:     'hidden',
}

const barFillStyle: React.CSSProperties = {
  height:       '100%',
  borderRadius: 'var(--radius-full)',
  transition:   'width 600ms ease',
}

const pctColStyle: React.CSSProperties = {
  width:      '40px',
  textAlign:  'right' as const,
  flexShrink: 0,
}

const pctStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize:   'var(--text-xs)',
  color:      'var(--color-text-muted)',
}

const tooltipStyle: React.CSSProperties = {
  position:   'absolute',
  left:       '50%',
  top:        'calc(100% + 6px)',
  transform:  'translateX(-50%)',
  background: 'rgba(10, 11, 15, 0.92)',
  border:     '1px solid var(--color-border)',
  borderRadius: 'var(--radius-sm)',
  padding:    'var(--space-1) var(--space-2)',
  fontFamily: 'var(--font-sans)',
  fontSize:   'var(--text-xs)',
  color:      'var(--color-text-secondary)',
  whiteSpace: 'nowrap' as const,
  zIndex:     10,
  pointerEvents: 'none' as const,
}