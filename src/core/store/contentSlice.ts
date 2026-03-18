import type { StateCreator } from 'zustand'
import type { ContentState, ContentActions } from '@/core/types'

export type ContentSlice = ContentState & ContentActions

export const createContentSlice: StateCreator<
  ContentSlice,
  [],
  [],
  ContentSlice
> = (set) => ({
  // ─── Initial State ─────────────────────────────────────────────────────────
  projects: [],
  skills: [],
  edges: [],
  timeline: [],
  arena: null,
  meta: null,

  // ─── Actions ───────────────────────────────────────────────────────────────

  // Write-once: replaces entire content state in a single atomic dispatch.
  // Content is never mutated after initialization (Doc 04 §2.6).
  loadContent: (payload: ContentState) =>
    set({
      projects: payload.projects,
      skills: payload.skills,
      edges: payload.edges,
      timeline: payload.timeline,
      arena: payload.arena,
      meta: payload.meta,
    }),
})