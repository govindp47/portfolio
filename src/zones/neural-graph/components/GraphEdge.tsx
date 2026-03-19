import React, { useState, useEffect, useRef } from 'react'
import type { SimulationLink, SimulationNode } from '../types'
import { weightToWidth } from '../utils/graphHelpers'

interface GraphEdgeProps {
  edge:          SimulationLink
  isHighlighted: boolean
  isDimmed:      boolean
}

/**
 * Skill relationship edge.
 *
 * CLASS CONTRACT (tick selector):
 *   line.graph-edge[data-source][data-target]
 *   → tick sets x1/y1/x2/y2 from nodeById lookup
 */
function GraphEdgeInner({ edge, isHighlighted, isDimmed }: GraphEdgeProps) {
  const [hasEntered, setHasEntered] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const rafRef   = useRef(0)

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      rafRef.current = requestAnimationFrame(() => setHasEntered(true))
    }, 200)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      cancelAnimationFrame(rafRef.current)
    }
  }, [])

  const opacity = hasEntered
    ? (isHighlighted ? 0.70 : isDimmed ? 0.04 : 0.22)
    : 0

  const stroke = isHighlighted ? 'var(--color-accent)' : 'var(--color-accent-muted)'
  const sw     = isHighlighted ? weightToWidth(edge.weight) + 0.8 : weightToWidth(edge.weight)

  const srcId = typeof edge.source === 'string' ? edge.source : (edge.source as SimulationNode).id
  const tgtId = typeof edge.target === 'string' ? edge.target : (edge.target as SimulationNode).id

  return (
    <line
      className="graph-edge"
      data-source={srcId}
      data-target={tgtId}
      x1={0} y1={0} x2={0} y2={0}
      stroke={stroke}
      strokeWidth={sw}
      opacity={opacity}
      style={{ transition: 'opacity 250ms ease, stroke 200ms ease', pointerEvents: 'none' }}
    />
  )
}

export const GraphEdge = React.memo(GraphEdgeInner, (prev, next) =>
  prev.isHighlighted === next.isHighlighted &&
  prev.isDimmed      === next.isDimmed      &&
  prev.edge.source   === next.edge.source   &&
  prev.edge.target   === next.edge.target
)
GraphEdge.displayName = 'GraphEdge'