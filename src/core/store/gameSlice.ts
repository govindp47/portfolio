import type { StateCreator } from 'zustand'
import type { GameState, GameActions, ZoneId } from '@/core/types'

// NOTE: `isActive` is intentionally NOT stored in GameState.
// It is a derived value: isActive = (activeMode === "explorer").
// Use the `selectIsGameActive` selector from store/index.ts instead.
// Storing it here would require synchronization with ModeSlice and
// introduces a potential inconsistency. See store/index.ts for the selector.

export type GameSlice = Omit<GameState, 'isActive'> & GameActions

export const createGameSlice: StateCreator<GameSlice, [], [], GameSlice> = (
  set,
  get
) => ({
  // ─── Initial State ─────────────────────────────────────────────────────────
  unlockedZones: [],
  dismissedChallenges: [],
  explorationLevel: 0,

  // ─── Actions ───────────────────────────────────────────────────────────────

  unlockZone: (zoneId: ZoneId) => {
    if (get().unlockedZones.includes(zoneId)) return
    set((state) => ({
      unlockedZones: [...state.unlockedZones, zoneId],
      explorationLevel: state.explorationLevel + 1,
    }))
  },

  dismissChallenge: (challengeId: string) => {
    if (get().dismissedChallenges.includes(challengeId)) return
    set((state) => ({
      dismissedChallenges: [...state.dismissedChallenges, challengeId],
    }))
  },
})