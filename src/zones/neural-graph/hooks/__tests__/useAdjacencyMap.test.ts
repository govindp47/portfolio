import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useAdjacencyMap } from '../useAdjacencyMap'
import type { SkillEdge } from '@/core/types/content'

const edge = (src: string, tgt: string): SkillEdge => ({
  source: src,
  target: tgt,
  weight: 0.5,
  relationshipType: 'uses',
})

describe('useAdjacencyMap', () => {
  it('returns empty map for empty edge list', () => {
    const { result } = renderHook(() => useAdjacencyMap([]))
    expect(result.current.size).toBe(0)
  })

  it('builds bidirectional adjacency for a simple graph', () => {
    const edges = [edge('a', 'b'), edge('b', 'c')]
    const { result } = renderHook(() => useAdjacencyMap(edges))
    expect(result.current.get('a')?.has('b')).toBe(true)
    expect(result.current.get('b')?.has('a')).toBe(true)
    expect(result.current.get('b')?.has('c')).toBe(true)
    expect(result.current.get('c')?.has('b')).toBe(true)
  })

  it('disconnected node (not in any edge) is not present in map', () => {
    const edges = [edge('a', 'b')]
    const { result } = renderHook(() => useAdjacencyMap(edges))
    expect(result.current.has('z')).toBe(false)
  })

  it('3-node 2-edge: a-b-c, node a is not adjacent to c', () => {
    const edges = [edge('a', 'b'), edge('b', 'c')]
    const { result } = renderHook(() => useAdjacencyMap(edges))
    expect(result.current.get('a')?.has('c')).toBe(false)
  })
})