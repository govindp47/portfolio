import type { StateCreator } from 'zustand'
import type { ModeState, ModeActions, UserMode } from '@/core/types'

export type ModeSlice = ModeState & ModeActions

// isMobile is derived once at module evaluation time and never mutated.
const isMobile =
  typeof window !== 'undefined' ? window.innerWidth < 768 : false

export const createModeSlice: StateCreator<ModeSlice, [], [], ModeSlice> = (
  set,
  get
) => ({
  // ─── Initial State ─────────────────────────────────────────────────────────
  activeMode: isMobile ? 'recruiter' : 'explorer',
  isMobile,

  // ─── Actions ───────────────────────────────────────────────────────────────

  setMode: (mode: UserMode) => {
    // No-op if already the active mode — prevents unnecessary re-renders
    if (mode === get().activeMode) return
    set({ activeMode: mode })
  },
})