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
    const { activeZone, isTransitioning } = get()
    if (zoneId === activeZone || isTransitioning) return
    set({
      isTransitioning: true,
      previousZone:    activeZone,
      activeZone:      zoneId,
      zoneEntryHint:   null,           // ← clear hint on every navigation
    })
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