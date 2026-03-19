import React, { useState, useEffect, useRef } from 'react'
import type { SkillType } from '@/core/types/content'
import type { SimulationNode } from '../types'
import { nodeRadius, nodeLogoSize, getSkillVisual, masteryAlpha } from '../utils/graphHelpers'

interface GraphNodeProps {
  node:       SimulationNode
  entryIndex: number
  isHovered:  boolean
  isAdjacent: boolean
  isDimmed:   boolean
  isSelected: boolean
  onHover:    (id: string | null) => void
  onClick:    (id: string) => void
}

/**
 * Skill node visual.
 *
 * D3 / React boundary:
 *   The <g.graph-node-group> has NO transform attribute from React.
 *   The tick handler in useForceSimulation sets:
 *     el.setAttribute('transform', 'translate(x,y)')
 *   React manages: group opacity (entry fade + dim), child strokes/fills.
 *   These are completely separate attributes — no conflict.
 *
 * Hit area:
 *   A transparent <circle> with pointerEvents="all" captures all mouse/click
 *   events. All visual elements have pointerEvents="none" to avoid double-fire.
 */
function GraphNodeInner({
  node,
  entryIndex,
  isHovered,
  isAdjacent: _adj,
  isDimmed,
  isSelected,
  onHover,
  onClick,
}: GraphNodeProps) {
  const [hasEntered, setHasEntered] = useState(false)
  const raf = useRef(0)

  useEffect(() => {
    raf.current = requestAnimationFrame(() => setHasEntered(true))
    return () => cancelAnimationFrame(raf.current)
  }, [])

  const type     = node.type as SkillType
  const r        = nodeRadius(type)
  const logoSz   = nodeLogoSize(type)
  const vis      = getSkillVisual(node.id, type)
  const alpha    = masteryAlpha(node.mastery)

  const groupOpacity = hasEntered ? (isDimmed ? 0.42 : 1.0) : 0
  const delay        = `${entryIndex * 20}ms`

  // Stroke: bright when active
  const strokeColor  = isHovered || isSelected ? vis.color : `${vis.color}66`
  const strokeWidth  = isHovered || isSelected ? 2.5 : 1.2

  // Logo URL from SimpleIcons CDN (white icon)
  const iconUrl = vis.iconSlug
    ? `https://cdn.simpleicons.org/${vis.iconSlug}/ffffff`
    : null

  // 2-letter fallback abbreviation
  const abbrev = node.label.replace(/[^A-Za-z0-9]/g, '').slice(0, 2).toUpperCase() || '??'

  // The gradient fill ID matches what GraphCanvas defines in <defs>
  const gradId = `grad-${node.id}`

  return (
    <g
      className="graph-node-group"
      data-id={node.id}
      // No transform here — D3 tick sets it via setAttribute
      style={{
        opacity:    groupOpacity,
        transition: `opacity 400ms ease ${delay}`,
      }}
    >
      {/* ── Outer glow pulse ring when selected ── */}
      {isSelected && (
        <circle
          r={r + 9}
          fill="none"
          stroke={vis.color}
          strokeWidth={1.5}
          opacity={0.35}
          style={{ pointerEvents: 'none' }}
        />
      )}

      {/* ── Hover highlight ring ── */}
      {isHovered && (
        <circle
          r={r + 5}
          fill="none"
          stroke={vis.color}
          strokeWidth={1}
          opacity={0.45}
          style={{ pointerEvents: 'none' }}
        />
      )}

      {/* ── Main circle: radial gradient fill ── */}
      <circle
        r={r}
        fill={`url(#${gradId})`}
        fillOpacity={isDimmed ? 0.5 : alpha}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        style={{ pointerEvents: 'none' }}
      />

      {/* ── Inner gloss highlight (top-left brightspot) ── */}
      <ellipse
        cx={-(r * 0.22)}
        cy={-(r * 0.28)}
        rx={r * 0.35}
        ry={r * 0.22}
        fill="white"
        opacity={isHovered || isSelected ? 0.18 : 0.09}
        style={{ pointerEvents: 'none' }}
      />

      {/* ── Tech logo or abbreviation ── */}
      {iconUrl ? (
        <image
          href={iconUrl}
          // Centered with padding: logo covers 55% of diameter
          x={-logoSz / 2}
          y={-logoSz / 2 - 1}
          width={logoSz}
          height={logoSz}
          // Clip to circle so square-bg logos don't overflow
          clipPath={`circle(${r - 4}px at ${logoSz / 2}px ${logoSz / 2 + 1}px)`}
          opacity={isDimmed ? 0.5 : isHovered || isSelected ? 1.0 : 0.88}
          style={{ pointerEvents: 'none' }}
        />
      ) : (
        <text
          y={5}
          textAnchor="middle"
          fontSize={r * 0.7}
          fontWeight="700"
          fill={vis.color}
          fontFamily="var(--font-sans)"
          opacity={0.9}
          style={{ pointerEvents: 'none', userSelect: 'none' }}
        >
          {abbrev}
        </text>
      )}

      {/* ── Skill label below circle ── */}
      <text
        y={isHovered || isSelected ? r + 24 : r + 18}
        textAnchor="middle"
        fontSize={isHovered || isSelected ? 12.5 : 11}
        fontWeight={isHovered || isSelected ? '800' : '600'}
        fill={isHovered || isSelected ? vis.color : 'var(--color-text-secondary)'}
        fontFamily="var(--font-sans)"
        letterSpacing={isHovered ? '0.02em' : '0.01em'}
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        {node.label}
      </text>

      {/* ── Transparent hit area — MUST be last so it's on top ── */}
      <circle
        r={r + 3}
        fill="transparent"
        onMouseEnter={() => onHover(node.id)}
        onMouseLeave={() => onHover(null)}
        onClick={(e) => { e.stopPropagation(); onClick(node.id) }}
        style={{ cursor: 'pointer' }}
      />
    </g>
  )
}

/**
 * Custom memo comparator:
 * Excludes position (node.x, node.y) — D3 owns position.
 * React only re-renders on interaction state changes.
 */
export const GraphNode = React.memo(GraphNodeInner, (prev, next) =>
  prev.isHovered  === next.isHovered  &&
  prev.isAdjacent === next.isAdjacent &&
  prev.isDimmed   === next.isDimmed   &&
  prev.isSelected === next.isSelected &&
  prev.entryIndex === next.entryIndex &&
  prev.node.id    === next.node.id
)
GraphNode.displayName = 'GraphNode'