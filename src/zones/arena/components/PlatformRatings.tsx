import type { PlatformRating } from '@/core/types/content'

interface PlatformRatingsProps {
  platforms: PlatformRating[]
}

export function PlatformRatings({ platforms }: PlatformRatingsProps) {
  return (
    <div style={gridStyle}>
      {platforms.map((p) => (
        <div key={p.platform} style={cardStyle}>
          <div style={platformLabelStyle}>{p.platform}</div>
          <div style={ratingStyle}>{p.rating}</div>
          <div style={contextStyle}>{p.context}</div>
          <a
            href={p.profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={linkStyle}
          >
            View Profile →
          </a>
        </div>
      ))}
    </div>
  )
}

const gridStyle: React.CSSProperties = {
  display:             'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
  gap:                 'var(--space-4)',
}

const cardStyle: React.CSSProperties = {
  display:       'flex',
  flexDirection: 'column',
  gap:           'var(--space-2)',
  padding:       'var(--space-4)',
  background:    'rgba(255,255,255,0.03)',
  border:        '1px solid var(--color-border)',
  borderRadius:  'var(--radius-md)',
}

const platformLabelStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize:   'var(--text-xs)',
  color:      'var(--color-text-muted)',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.08em',
}

const ratingStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize:   'var(--text-2xl)',
  fontWeight: 'var(--font-weight-bold)',
  color:      'var(--color-accent)',
  lineHeight:  1,
}

const contextStyle: React.CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize:   'var(--text-sm)',
  color:      'var(--color-text-secondary)',
}

const linkStyle: React.CSSProperties = {
  fontFamily:     'var(--font-sans)',
  fontSize:       'var(--text-xs)',
  color:          'var(--color-accent)',
  textDecoration: 'underline',
  marginTop:      'var(--space-1)',
}