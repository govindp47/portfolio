import { SectionHeading } from '@/core/design-system/components'
import { BodyText } from '@/core/design-system/typography'
import type { CertificationGroup } from '@/core/types/content'

interface CertificationGroupsProps {
  groups: CertificationGroup[]
}

export function CertificationGroups({ groups }: CertificationGroupsProps) {
  return (
    <div style={containerStyle} data-testid="certification-groups">
      {groups.map((group) => (
        <div key={group.domain} style={groupStyle} data-testid={`cert-group-${group.domain}`}>
          <SectionHeading>{group.domain}</SectionHeading>
          <div style={itemsStyle}>
            {group.items.map((cert, i) => (
              <div key={i} style={certStyle}>
                <div style={certHeaderStyle}>
                  <span style={certTitleStyle}>{cert.title}</span>
                  <span style={certYearStyle}>{cert.year}</span>
                </div>
                <span style={certIssuerStyle}>{cert.issuer}</span>
                <BodyText>
                  <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
                    {cert.focus}
                  </span>
                </BodyText>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

const containerStyle: React.CSSProperties = {
  display:       'flex',
  flexDirection: 'column',
  gap:           'var(--space-6)',
}

const groupStyle: React.CSSProperties = {
  display:       'flex',
  flexDirection: 'column',
  gap:           'var(--space-3)',
}

const itemsStyle: React.CSSProperties = {
  display:       'flex',
  flexDirection: 'column',
  gap:           'var(--space-3)',
}

const certStyle: React.CSSProperties = {
  display:       'flex',
  flexDirection: 'column',
  gap:           'var(--space-1)',
  padding:       'var(--space-3)',
  background:    'rgba(255,255,255,0.02)',
  border:        '1px solid var(--color-border)',
  borderRadius:  'var(--radius-sm)',
}

const certHeaderStyle: React.CSSProperties = {
  display:        'flex',
  justifyContent: 'space-between',
  alignItems:     'flex-start',
}

const certTitleStyle: React.CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize:   'var(--text-sm)',
  fontWeight: 'var(--font-weight-medium)',
  color:      'var(--color-text-primary)',
}

const certYearStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize:   'var(--text-xs)',
  color:      'var(--color-text-muted)',
  flexShrink: 0,
}

const certIssuerStyle: React.CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize:   'var(--text-xs)',
  color:      'var(--color-accent)',
}