import { create } from 'zustand'
import {
  createNavigationSlice,
  type NavigationSlice,
} from './navigationSlice'
import { createModeSlice, type ModeSlice } from './modeSlice'
import { createTerminalSlice, type TerminalSlice } from './terminalSlice'
import { createGameSlice, type GameSlice } from './gameSlice'
import { createSessionSlice, type SessionSlice } from './sessionSlice'
import { createContentSlice, type ContentSlice } from './contentSlice'

export type AppState = NavigationSlice &
  ModeSlice &
  TerminalSlice &
  GameSlice &
  SessionSlice &
  ContentSlice

export const useStore = create<AppState>()((...args) => ({
  ...createNavigationSlice(...args),
  ...createModeSlice(...args),
  ...createTerminalSlice(...args),
  ...createGameSlice(...args),
  ...createSessionSlice(...args),
  ...createContentSlice(...args),
}))

// ─── Derived Selectors ────────────────────────────────────────────────────────

/**
 * Derived selector: the game layer is active when the user is in Explorer mode.
 * `isActive` is intentionally NOT stored in GameSlice to avoid state
 * synchronization issues with ModeSlice. Always use this selector.
 */
export const selectIsGameActive = (state: AppState): boolean =>
  state.activeMode === 'explorer'