import React from 'react'
import { MetricBadge } from '@/core/design-system/components'
import type { MetricItem } from '@/core/types/content'

interface MetricsGridProps {
  metrics: MetricItem[]
}

const gridStyle: React.CSSProperties = {
  display:             'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap:                 'var(--space-6)',
  marginTop:           'var(--space-6)',
}

function MetricsGridInner({ metrics }: MetricsGridProps) {
  return (
    <div style={gridStyle} role="list" aria-label="System metrics">
      {metrics.map((item) => (
        <div key={item.label} role="listitem">
          <MetricBadge
            value={item.value}
            label={item.label}
            tooltip={item.tooltip}
          />
        </div>
      ))}
    </div>
  )
}

export const MetricsGrid = React.memo(MetricsGridInner)
MetricsGrid.displayName = 'MetricsGrid'