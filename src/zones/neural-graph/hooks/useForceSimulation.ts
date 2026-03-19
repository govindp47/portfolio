import { useRef, useState, useEffect } from 'react'
import * as d3 from 'd3'
import type { Skill, SkillEdge, SkillType } from '@/core/types/content'
import type { SimulationNode, SimulationLink } from '../types'
import { nodeCollisionRadius } from '../utils/graphHelpers'

export interface UseForceSimulationReturn {
  svgRef:          React.RefObject<SVGSVGElement>
  simulationNodes: SimulationNode[]
  simulationLinks: SimulationLink[]
  isSimulationStable: boolean
  /**
   * Write-only ref for caller to specify which node IDs should be frozen
   * (held at their settled position) during the ambient motion loop.
   * Caller sets this on hover; ambient loop reads it every frame.
   */
  frozenNodesRef:  React.MutableRefObject<Set<string>>
}

/**
 * ── Architecture ──────────────────────────────────────────────────────────────
 *
 * Phase 1 (deps: skills/edges):
 *   Build SimulationNode[]/SimulationLink[] → setState → React renders SVG elements.
 *   Two RAFs wait for React commit + browser layout.
 *   Then setReady(true) → triggers Phase 2.
 *
 * Phase 2 (deps: ready):
 *   SVG elements are now in DOM with real pixel dimensions.
 *   Pre-position nodes on an ELLIPTICAL phyllotaxis spiral that fills the full
 *   SVG width AND height (not just a circle in the middle).
 *   Start D3 force simulation with forces tuned for wide spread.
 *
 * After simulation settles:
 *   Record each node's base position.
 *   Start an ambient RAF loop: each node oscillates gently with a unique
 *   frequency and phase (slow sine wave, 6–14s period, 8–18px amplitude).
 *   Nodes in frozenNodesRef.current are held at their base position (hover effect).
 *
 * Tick handler:
 *   React-rendered SVG elements have NO D3 datum bound. Use DOM setAttribute
 *   with a nodeById Map lookup — NOT d3 data-bound callbacks.
 *
 * PROFILER VALIDATED: zero React re-renders during tick. [fill in date]
 */
export function useForceSimulation(
  skills: Skill[],
  edges:  SkillEdge[]
): UseForceSimulationReturn {
  const svgRef = useRef<SVGSVGElement>(null)

  const [simulationNodes, setSimulationNodes] = useState<SimulationNode[]>([])
  const [simulationLinks, setSimulationLinks] = useState<SimulationLink[]>([])
  const [isSimulationStable, setIsSimulationStable] = useState(false)
  const [ready, setReady] = useState(false)

  const simulationRef    = useRef<d3.Simulation<SimulationNode, SimulationLink> | null>(null)
  const ambientRafRef    = useRef(0)
  const frozenNodesRef   = useRef<Set<string>>(new Set())

  // ── Phase 1: Build arrays → trigger React render ─────────────────────────
  useEffect(() => {
    if (simulationRef.current) { simulationRef.current.stop(); simulationRef.current = null }
    cancelAnimationFrame(ambientRafRef.current)
    setReady(false)
    setIsSimulationStable(false)

    if (skills.length === 0) { setSimulationNodes([]); setSimulationLinks([]); return }

    const nodes: SimulationNode[] = skills.map((s) => ({ ...s }))
    const links: SimulationLink[] = edges.map((e) => ({
      source: e.source, target: e.target,
      weight: e.weight, relationshipType: e.relationshipType,
    }))

    setSimulationNodes(nodes)
    setSimulationLinks(links)

    // Two RAFs: React commit (1st) + browser layout (2nd)
    let r1 = 0, r2 = 0
    r1 = requestAnimationFrame(() => { r2 = requestAnimationFrame(() => setReady(true)) })
    return () => { cancelAnimationFrame(r1); cancelAnimationFrame(r2) }
  }, [skills, edges])

  // ── Phase 2: D3 simulation after SVG elements exist in DOM ───────────────
  useEffect(() => {
    if (!ready || simulationNodes.length === 0) return
    const svg = svgRef.current
    if (!svg) return

    if (simulationRef.current) { simulationRef.current.stop(); simulationRef.current = null }
    cancelAnimationFrame(ambientRafRef.current)

    const { width, height } = svg.getBoundingClientRect()
    const W  = width  > 0 ? width  : 1200
    const H  = height > 0 ? height : 700
    const cx = W / 2
    const cy = H / 2

    // ── Elliptical phyllotaxis pre-positioning ────────────────────────────
    // Spreads nodes across the FULL SVG width AND height using the golden angle.
    // spreadX/Y use separate fractions so landscape screens fill horizontally.
    const goldenAngle = 2.399963229  // radians
    const spreadX     = W * 0.43    // 86% of full width
    const spreadY     = H * 0.42    // 84% of full height
    const edgePad     = 55          // min distance from SVG edge

    simulationNodes.forEach((node, i) => {
      const normR = Math.sqrt((i + 0.5) / simulationNodes.length)
      const theta = i * goldenAngle
      node.x  = Math.max(edgePad, Math.min(W - edgePad, cx + normR * spreadX * Math.cos(theta)))
      node.y  = Math.max(edgePad, Math.min(H - edgePad, cy + normR * spreadY * Math.sin(theta)))
      node.vx = 0
      node.vy = 0
    })

    // ── nodeById Map — D3 mutates .x/.y on these objects each tick ────────
    const nodeById = new Map<string, SimulationNode>(simulationNodes.map((n) => [n.id, n]))

    // ── Tick handler — DOM setAttribute only, NO setState ─────────────────
    function applyPositions(): void {
      svg!.querySelectorAll<SVGGElement>('g.graph-node-group').forEach((el) => {
        const node = nodeById.get(el.getAttribute('data-id') ?? '')
        if (node) el.setAttribute('transform', `translate(${node.x ?? cx},${node.y ?? cy})`)
      })
      svg!.querySelectorAll<SVGLineElement>('line.graph-edge').forEach((el) => {
        const src = nodeById.get(el.getAttribute('data-source') ?? '')
        const tgt = nodeById.get(el.getAttribute('data-target') ?? '')
        if (src && tgt) {
          el.setAttribute('x1', String(src.x ?? 0)); el.setAttribute('y1', String(src.y ?? 0))
          el.setAttribute('x2', String(tgt.x ?? 0)); el.setAttribute('y2', String(tgt.y ?? 0))
        }
      })
    }

    // ── Soft boundary force — keeps nodes inside SVG viewport ─────────────
    function boundaryForce() {
      for (const n of simulationNodes) {
        const r = nodeCollisionRadius(n.type as SkillType)
        const minX = r, maxX = W - r, minY = r, maxY = H - r
        if ((n.x ?? 0) < minX) n.vx = (n.vx ?? 0) + (minX - (n.x ?? 0)) * 0.9
        if ((n.x ?? 0) > maxX) n.vx = (n.vx ?? 0) + (maxX - (n.x ?? 0)) * 0.9
        if ((n.y ?? 0) < minY) n.vy = (n.vy ?? 0) + (minY - (n.y ?? 0)) * 0.9
        if ((n.y ?? 0) > maxY) n.vy = (n.vy ?? 0) + (maxY - (n.y ?? 0)) * 0.9
      }
    }

    const simulation = d3
      .forceSimulation<SimulationNode>(simulationNodes)
      .force('link',
        d3.forceLink<SimulationNode, SimulationLink>(simulationLinks)
          .id((d) => d.id)
          .distance(200)    // long links → spread apart
          .strength(0.12)   // weak → links don't cluster nodes
      )
      .force('charge',
        d3.forceManyBody<SimulationNode>()
          .strength((d) => d.type === 'domain' ? -700 : -500) // strong repulsion
          .distanceMax(500)
      )
      .force('center', d3.forceCenter<SimulationNode>(cx, cy).strength(0.025)) // very weak centering
      .force('collide',
        d3.forceCollide<SimulationNode>()
          .radius((d) => nodeCollisionRadius(d.type as SkillType))
          .strength(1.0)
          .iterations(3)
      )
      .force('boundary', boundaryForce)
      .alphaDecay(0.012)  // slow cooling → better final spread
      .alphaMin(0.001)
      .velocityDecay(0.45)
      .on('tick', applyPositions)
      .on('end', () => {
        // ── Start ambient motion after simulation settles ──────────────────
        // Each node oscillates gently around its settled position.
        // Nodes in frozenNodesRef stay frozen (held at base pos on hover).

        type OscParams = {
          baseX: number; baseY: number
          ax: number; ay: number   // amplitude (px)
          fx: number; fy: number   // angular frequency (rad/ms)
          px: number; py: number   // phase offset
        }

        const oscMap = new Map<string, OscParams>()
        simulationNodes.forEach((node) => {
          oscMap.set(node.id, {
            baseX: node.x ?? cx,
            baseY: node.y ?? cy,
            ax: 6  + Math.random() * 12,   // 6–18px amplitude
            ay: 6  + Math.random() * 12,
            // Period 8000–20000ms → very slow drift
            fx: (2 * Math.PI) / (8000 + Math.random() * 12000),
            fy: (2 * Math.PI) / (8000 + Math.random() * 12000),
            px: Math.random() * Math.PI * 2,
            py: Math.random() * Math.PI * 2,
          })
        })

        const t0 = performance.now()

        function ambientTick() {
          const t = performance.now() - t0
          for (const node of simulationNodes) {
            const o = oscMap.get(node.id)!
            if (frozenNodesRef.current.has(node.id)) {
              // Frozen: snap back to settled base position
              node.x = o.baseX
              node.y = o.baseY
            } else {
              node.x = o.baseX + o.ax * Math.sin(o.fx * t + o.px)
              node.y = o.baseY + o.ay * Math.sin(o.fy * t + o.py)
            }
          }
          applyPositions()
          ambientRafRef.current = requestAnimationFrame(ambientTick)
        }

        ambientRafRef.current = requestAnimationFrame(ambientTick)
        setIsSimulationStable(true)
      })

    simulationRef.current = simulation

    // Re-center on resize
    const ro = new ResizeObserver(() => {
      const rect = svg.getBoundingClientRect()
      if (rect.width === 0 || rect.height === 0) return
      const cf = simulation.force<d3.ForceCenter<SimulationNode>>('center')
      if (cf) cf.x(rect.width / 2).y(rect.height / 2)
      simulation.alpha(0.3).restart()
    })
    ro.observe(svg)

    return () => {
      simulation.stop()
      simulation.on('tick', null).on('end', null)
      simulationRef.current = null
      cancelAnimationFrame(ambientRafRef.current)
      ro.disconnect()
    }
  }, [ready]) // eslint-disable-line react-hooks/exhaustive-deps

  return { svgRef, simulationNodes, simulationLinks, isSimulationStable, frozenNodesRef }
}