import { useEffect, useMemo } from 'react'
import { AnimatePresence } from 'framer-motion'
import type { Skill, SkillEdge } from '@/core/types/content'
import { useStore } from '@/core/hooks/useStore'
import { useForceSimulation } from '../hooks/useForceSimulation'
import { useGraphInteraction } from '../hooks/useGraphInteraction'
import { useAdjacencyMap } from '../hooks/useAdjacencyMap'
import { GraphNode } from './GraphNode'
import { GraphEdge } from './GraphEdge'
import { NodeDetailPanel } from './NodeDetailPanel'
import { getSkillVisual, getDirectNeighbors } from '../utils/graphHelpers'
import type { SimulationNode, SimulationLink } from '../types'
import type { SkillType } from '@/core/types/content'

interface GraphCanvasProps {
  skills: Skill[]
  edges:  SkillEdge[]
}

/**
 * GraphCanvas — hosts the force graph SVG.
 *
 * No zoom/pan: nodes fill the full zone area; panning is unnecessary.
 *
 * SVG <defs> defines per-skill radial gradients used by GraphNode circles.
 * Each gradient: brand color inner → darker shade outer → transparent edge.
 * This creates a glowing badge appearance.
 *
 * Hover behaviour:
 *   - hovered node + direct neighbors: full opacity, not frozen
 *   - all other nodes: 12% opacity (dimmed)
 *   - hovered node + direct neighbors are FROZEN in ambient motion
 *   - dimmed nodes continue ambient motion in background
 */
export default function GraphCanvas({ skills, edges }: GraphCanvasProps) {
  const openOverlay = useStore((s) => s.openOverlay)

  const {
    svgRef, simulationNodes, simulationLinks, isSimulationStable, frozenNodesRef,
  } = useForceSimulation(skills, edges)
  void isSimulationStable

  const {
    hoveredNodeId, selectedNodeId,
    handleNodeHover, handleNodeClick, handleSvgClick,
  } = useGraphInteraction()

  const adjacencyMap = useAdjacencyMap(edges)

  // ── Highlighted set: hovered node + direct neighbors ─────────────────────
  const highlightedNodes = useMemo(() => {
    if (!hoveredNodeId) return new Set<string>()
    return getDirectNeighbors(hoveredNodeId, adjacencyMap)
  }, [hoveredNodeId, adjacencyMap])

  // ── Sync highlighted set → frozenNodesRef for ambient motion ─────────────
  // Frozen nodes are held at their settled position while others keep moving.
  useEffect(() => {
    frozenNodesRef.current = highlightedNodes
  }, [highlightedNodes, frozenNodesRef])

  // ── Interaction flags ─────────────────────────────────────────────────────
  function resolveId(ep: string | SimulationNode): string {
    return typeof ep === 'string' ? ep : ep.id
  }

  function nodeIsDimmed(id: string): boolean {
    if (!hoveredNodeId) return false
    return !highlightedNodes.has(id)
  }

  function edgeIsHighlighted(link: SimulationLink): boolean {
    if (!hoveredNodeId) return false
    return resolveId(link.source) === hoveredNodeId || resolveId(link.target) === hoveredNodeId
  }

  function edgeIsDimmed(link: SimulationLink): boolean {
    return hoveredNodeId !== null && !edgeIsHighlighted(link)
  }

  // ── Detail panel ──────────────────────────────────────────────────────────
  const selectedSkill: Skill | null =
    selectedNodeId ? (skills.find((s) => s.id === selectedNodeId) ?? null) : null
  const projectCount = selectedSkill?.projectRefs.length ?? 0

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        style={{ display: 'block', overflow: 'visible' }}
        aria-label="Skill graph"
        onClick={handleSvgClick}
      >
        {/* ── Per-skill radial gradient defs ── */}
        <defs>
          {skills.map((skill) => {
            const vis    = getSkillVisual(skill.id, skill.type as SkillType)
            const gradId = `grad-${skill.id}`
            return (
              <radialGradient
                key={gradId}
                id={gradId}
                cx="38%"  // shifted left for 3D orb effect
                cy="32%"  // shifted up
                r="70%"
                fx="38%"
                fy="32%"
              >
                {/* Inner bright stop */}
                <stop offset="0%"   stopColor={vis.color}     stopOpacity={0.55} />
                {/* Mid transition */}
                <stop offset="55%"  stopColor={vis.colorDark} stopOpacity={0.35} />
                {/* Outer dark edge */}
                <stop offset="100%" stopColor={vis.colorDark} stopOpacity={0.12} />
              </radialGradient>
            )
          })}

          {/* Global glow filter for hovered/selected nodes */}
          <filter id="node-glow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* All graph content — no zoom wrapper needed */}
        <g className="graph-content">

          {/* Edges below nodes */}
          <g className="edges">
            {simulationLinks.map((link) => {
              const srcId = resolveId(link.source)
              const tgtId = resolveId(link.target)
              return (
                <GraphEdge
                  key={`${srcId}->${tgtId}`}
                  edge={link}
                  isHighlighted={edgeIsHighlighted(link)}
                  isDimmed={edgeIsDimmed(link)}
                />
              )
            })}
          </g>

          {/* Nodes */}
          <g className="nodes">
            {simulationNodes.map((node, i) => (
              <GraphNode
                key={node.id}
                node={node}
                entryIndex={i}
                isHovered={node.id === hoveredNodeId}
                isAdjacent={hoveredNodeId !== null && (adjacencyMap.get(hoveredNodeId)?.has(node.id) ?? false)}
                isDimmed={nodeIsDimmed(node.id)}
                isSelected={node.id === selectedNodeId}
                onHover={handleNodeHover}
                onClick={handleNodeClick}
              />
            ))}
          </g>

        </g>
      </svg>

      <AnimatePresence>
        {selectedSkill !== null && (
          <NodeDetailPanel
            key={selectedSkill.id}
            skill={selectedSkill}
            projectCount={projectCount}
            onClose={() => handleNodeClick(selectedSkill.id)}
            onQuizTrigger={() => openOverlay('quiz-modal')}
          />
        )}
      </AnimatePresence>
    </div>
  )
}