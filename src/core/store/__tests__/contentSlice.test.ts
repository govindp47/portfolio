import { describe, it, expect, beforeEach } from 'vitest'
import { create } from 'zustand'
import { createContentSlice, type ContentSlice } from '../contentSlice'
import type { ContentState } from '@/core/types'

const makeStore = () =>
  create<ContentSlice>()((...args) => ({ ...createContentSlice(...args) }))

const mockPayload: ContentState = {
  projects: [{ id: 'p1', title: 'Test', problem: '', problemFull: '',
    constraints: [], architecture: '', tradeoffs: [], stack: [],
    outcome: '', outcomeFull: '', demoUrl: null, displayOrder: 1, skillRefs: [] }],
  skills: [],
  edges: [],
  timeline: [],
  arena: null,
  meta: null,
}

describe('contentSlice', () => {
  let useStore: ReturnType<typeof makeStore>

  beforeEach(() => {
    useStore = makeStore()
  })

  it('initial state has empty arrays and null values', () => {
    const s = useStore.getState()
    expect(s.projects).toHaveLength(0)
    expect(s.arena).toBeNull()
    expect(s.meta).toBeNull()
  })

  it('loadContent replaces entire content state', () => {
    useStore.getState().loadContent(mockPayload)
    expect(useStore.getState().projects).toHaveLength(1)
    expect(useStore.getState().projects[0].id).toBe('p1')
  })

  it('subsequent reads after loadContent reflect loaded data', () => {
    useStore.getState().loadContent(mockPayload)
    expect(useStore.getState().projects[0].title).toBe('Test')
  })
})