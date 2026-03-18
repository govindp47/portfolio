import type { StateCreator } from 'zustand'
import type { SessionFlags, SessionFlagActions } from '@/core/types'

const SESSION_KEY = 'govindos-boot-played'

export type SessionSlice = SessionFlags & SessionFlagActions

export const createSessionSlice: StateCreator<
  SessionSlice,
  [],
  [],
  SessionSlice
> = (set) => ({
  // ─── Initial State ─────────────────────────────────────────────────────────
  // Seed bootPlayed from sessionStorage on initialization (Doc 04 §8.1)
  bootPlayed:
    typeof sessionStorage !== 'undefined'
      ? sessionStorage.getItem(SESSION_KEY) === 'true'
      : false,
  guidedFlowDismissed: false,
  contentLoaded: false,

  // ─── Actions ───────────────────────────────────────────────────────────────

  markBootPlayed: () => {
    sessionStorage.setItem(SESSION_KEY, 'true')
    set({ bootPlayed: true })
  },

  dismissGuidedFlow: () => set({ guidedFlowDismissed: true }),

  markContentLoaded: () => set({ contentLoaded: true }),
})