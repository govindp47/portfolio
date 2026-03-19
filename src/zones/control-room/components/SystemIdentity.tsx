import { SectionHeading } from '@/core/design-system/components'
import { MonoText, BodyText } from '@/core/design-system/typography'
import type { SystemMeta } from '@/core/types/content'

interface SystemIdentityProps {
  meta: SystemMeta
}

export function SystemIdentity({ meta }: SystemIdentityProps) {
  return (
    <div
      style={{
        display:       'flex',
        flexDirection: 'column',
        gap:           'var(--space-2)',
      }}
    >
      {/* Name */}
      <SectionHeading>{meta.name}</SectionHeading>

      {/* Version */}
      <MonoText size="xs">
        <span style={{ color: 'var(--color-accent)' }}>{`v${meta.version}`}</span>
      </MonoText>

      {/* Role */}
      <BodyText>
        <span style={{ color: 'var(--color-text-secondary)' }}>{meta.role}</span>
      </BodyText>

      {/* Stack */}
      <BodyText>
        <span style={{ color: 'var(--color-text-muted)' }}>{meta.stack}</span>
      </BodyText>
    </div>
  )
}