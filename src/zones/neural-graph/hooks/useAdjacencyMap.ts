import { useMemo } from 'react'
import type { SkillEdge } from '@/core/types/content'

/**
 * Pre-computes an undirected adjacency map from the edge list.
 * Memoized on [edges] — never recomputed on hover events.
 *
 * Returns Map<nodeId, Set<adjacentNodeId>>.
 * Disconnected nodes are NOT present (only nodes referenced in edges appear).
 */
export function useAdjacencyMap(edges: SkillEdge[]): Map<string, Set<string>> {
  return useMemo(() => {
    const map = new Map<string, Set<string>>()

    for (const edge of edges) {
      const src = typeof edge.source === 'string' ? edge.source : (edge.source as { id: string }).id
      const tgt = typeof edge.target === 'string' ? edge.target : (edge.target as { id: string }).id

      if (!map.has(src)) map.set(src, new Set())
      if (!map.has(tgt)) map.set(tgt, new Set())

      map.get(src)!.add(tgt)
      map.get(tgt)!.add(src)
    }

    return map
  }, [edges])
}