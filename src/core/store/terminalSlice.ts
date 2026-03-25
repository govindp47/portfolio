import type { StateCreator } from 'zustand'
import type { TerminalState, TerminalActions, TerminalEntry } from '@/core/types'
import type { AppState } from './index'
import { resolveCommand, extractArgs } from '@/core/utils/commandRegistry'

export type TerminalSlice = TerminalState & TerminalActions

export const createTerminalSlice: StateCreator<
  AppState,
  [],
  [],
  TerminalSlice
> = (set, get) => ({
  // ─── Initial State ─────────────────────────────────────────────────────────
  isOpen:       false,
  history:      [],
  inputBuffer:  '',

  // ─── Actions ───────────────────────────────────────────────────────────────

  openTerminal:  () => set({ isOpen: true }),
  closeTerminal: () => set({ isOpen: false }),

  setInputBuffer: (value: string) => set({ inputBuffer: value }),

  clearHistory: () => set({ history: [] }),

  addSuggestionOutput: (content: string) => {
    const entry: TerminalEntry = { type: 'output', content, timestamp: Date.now() }
    set((state) => ({ history: [...state.history, entry] }))
  },

  submitCommand: (input: string) => {
    const trimmed = input.trim()
    if (!trimmed) return

    // 1. Append the input entry
    const inputEntry: TerminalEntry = {
      type:      'input',
      content:   trimmed,
      timestamp: Date.now(),
    }
    set((state) => ({ history: [...state.history, inputEntry], inputBuffer: '' }))

    // 2. Resolve command
    const entry = resolveCommand(trimmed)
    if (!entry) {
      const errEntry: TerminalEntry = {
        type:      'error',
        content:   "command not found — type 'help' for options",
        timestamp: Date.now(),
      }
      set((state) => ({ history: [...state.history, errEntry] }))
      return
    }

    // 3. Special-case: clear
    if (entry.name === 'clear') {
      set({ history: [] })
      return
    }

    // 4. Special-case: exit
    if (entry.name === 'exit') {
      const outEntry: TerminalEntry = {
        type:      'output',
        content:   'Closing terminal...',
        timestamp: Date.now(),
      }
      set((state) => ({ history: [...state.history, outEntry] }))
      set({ isOpen: false })
      return
    }

    // 5. Extract args and grab cross-slice state
    const args        = extractArgs(trimmed, entry)
    const content     = {
      projects: get().projects,
      skills:   get().skills,
      edges:    get().edges,
      timeline: get().timeline,
      arena:    get().arena,
      meta:     get().meta,
    }
    const navigateTo  = get().navigateTo

    // 6. Invoke resolver
    const result = entry.resolver(args, content, navigateTo)

    if (typeof result === 'string') {
      if (result.length > 0) {
        const outEntry: TerminalEntry = { type: 'output', content: result, timestamp: Date.now() }
        set((state) => ({ history: [...state.history, outEntry] }))
      }
    } else {
      // Promise path — append placeholder, then replace on resolution
      const placeholderTs = Date.now()
      const placeholder: TerminalEntry = { type: 'output', content: '...', timestamp: placeholderTs }
      set((state) => ({ history: [...state.history, placeholder] }))

      result.then((resolved) => {
        set((state) => ({
          history: state.history.map((e) =>
            e.timestamp === placeholderTs ? { ...e, content: resolved } : e
          ),
        }))
      })
    }
  },
})