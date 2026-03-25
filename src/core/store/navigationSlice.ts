import type { StateCreator } from 'zustand'
import type {
  NavigationState,
  NavigationActions,
  ZoneId,
  OverlayId,
} from '@/core/types'

export type NavigationSlice = NavigationState & NavigationActions

export const createNavigationSlice: StateCreator<
  NavigationSlice,
  [],
  [],
  NavigationSlice
> = (set, get) => ({
  // ─── Initial State ─────────────────────────────────────────────────────────
  activeZone:      'control-room',
  previousZone:    null,
  isTransitioning: false,
  overlayStack:    [],
  miniMapOpen:     false,
  zoneEntryHint:   null,               // ← NEW

  // ─── Actions ───────────────────────────────────────────────────────────────

  navigateTo: (zoneId: ZoneId) => {
    const state = get() as NavigationSlice & {
      activeMode: string
      unlockedZones: ZoneId[]
      unlockZone: (id: ZoneId) => void
    }
    const { activeZone, isTransitioning, activeMode, unlockedZones, unlockZone } = state
    if (zoneId === activeZone || isTransitioning) return
    set({
      isTransitioning: true,
      previousZone:    activeZone,
      activeZone:      zoneId,
      zoneEntryHint:   null,
    })
    // Game layer side-effect: unlock zone on first visit in Explorer Mode (Doc 04 §9)
    if (activeMode === 'explorer' && !unlockedZones.includes(zoneId)) {
      unlockZone(zoneId)
    }
  },

  openOverlay: (overlayId: OverlayId) => {
    const { overlayStack, closeOverlay } = get()
    if (overlayId === 'quiz-modal' && overlayStack.includes('terminal')) {
      closeOverlay('terminal')
    }
    set((state) => ({ overlayStack: [...state.overlayStack, overlayId] }))
  },

  closeOverlay: (overlayId: OverlayId) => {
    set((state) => ({
      overlayStack: state.overlayStack.filter((id) => id !== overlayId),
    }))
  },

  toggleMiniMap: () => {
    set((state) => ({ miniMapOpen: !state.miniMapOpen }))
  },

  onTransitionComplete: () => {
    set({ isTransitioning: false })
  },

  setZoneEntryHint: (hint: Record<string, unknown> | null) => {
    set({ zoneEntryHint: hint })
  },
})