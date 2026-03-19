import type { Skill } from '@/core/types/content'
import type { RelType } from '@/core/types/content'

/**
 * SimulationNode extends Skill with D3 force simulation runtime fields.
 * D3 mutates these fields directly on each tick — never copy the original
 * content store objects. Always shallow-copy before passing to D3.
 */
export interface SimulationNode extends Skill {
  x?: number
  y?: number
  vx?: number
  vy?: number
  fx?: number | null
  fy?: number | null
  index?: number
}

/**
 * SimulationLink mirrors D3's link format.
 * D3 mutates `source` and `target` from ID strings to SimulationNode
 * object references during simulation initialization — hence the union type.
 */
export interface SimulationLink {
  source: string | SimulationNode
  target: string | SimulationNode
  weight: number
  relationshipType: RelType
}

export interface GraphInteractionState {
  hoveredNodeId: string | null
  selectedNodeId: string | null
}