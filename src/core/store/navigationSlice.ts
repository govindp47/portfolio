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
  activeZone: 'control-room',
  previousZone: null,
  isTransitioning: false,
  overlayStack: [],
  miniMapOpen: false,

  // ─── Actions ───────────────────────────────────────────────────────────────

  navigateTo: (zoneId: ZoneId) => {
    const { activeZone, isTransitioning } = get()
    // No-op: same zone or mid-transition — calls during transition are silently dropped
    if (zoneId === activeZone || isTransitioning) return
    set({
      isTransitioning: true,
      previousZone: activeZone,
      activeZone: zoneId,
    })
  },

  openOverlay: (overlayId: OverlayId) => {
    const { overlayStack, closeOverlay } = get()
    // Quiz modal is exclusive: close terminal first if open (Doc 04 §4.2)
    if (overlayId === 'quiz-modal' && overlayStack.includes('terminal')) {
      closeOverlay('terminal')
    }
    set((state) => ({
      overlayStack: [...state.overlayStack, overlayId],
    }))
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
})