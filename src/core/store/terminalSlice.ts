import type { StateCreator } from 'zustand'
import type { TerminalState, TerminalActions, TerminalEntry } from '@/core/types'

export type TerminalSlice = TerminalState & TerminalActions

export const createTerminalSlice: StateCreator<
  TerminalSlice,
  [],
  [],
  TerminalSlice
> = (set) => ({
  // ─── Initial State ─────────────────────────────────────────────────────────
  isOpen: false,
  history: [],
  // NOTE for component developers: `inputBuffer` lives here in the store as
  // the spec describes, but the TerminalInput component should manage the live
  // keystroke value in React local state and only write to the store on
  // submission via submitCommand(). setInputBuffer() is available for edge
  // cases (e.g., tab-autocomplete filling the field from store context).
  inputBuffer: '',

  // ─── Actions ───────────────────────────────────────────────────────────────

  openTerminal: () => set({ isOpen: true }),

  closeTerminal: () => set({ isOpen: false }),

  setInputBuffer: (value: string) => set({ inputBuffer: value }),

  submitCommand: (input: string) => {
    const trimmed = input.trim()
    if (!trimmed) return

    const inputEntry: TerminalEntry = {
      type: 'input',
      content: trimmed,
      timestamp: Date.now(),
    }

    // STUB: Command registry not yet connected (wired in T-032).
    // This output entry will be replaced by the resolver result in T-032.
    const outputEntry: TerminalEntry = {
      type: 'output',
      content: '[command registry not yet connected]',
      timestamp: Date.now(),
    }

    set((state) => ({
      history: [...state.history, inputEntry, outputEntry],
      inputBuffer: '',
    }))
  },

  clearHistory: () => set({ history: [] }),
})