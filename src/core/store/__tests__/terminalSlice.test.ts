/**
 * terminalSlice.test.ts — Document 08 Section 4.4
 * Terminal session integration tests against the full composed store.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { create } from 'zustand'
import { createNavigationSlice } from '../navigationSlice'
import { createModeSlice } from '../modeSlice'
import { createTerminalSlice } from '../terminalSlice'
import { createGameSlice } from '../gameSlice'
import { createSessionSlice } from '../sessionSlice'
import { createContentSlice } from '../contentSlice'
import type { AppState } from '../index'

// ── Minimal composed store for terminal tests ─────────────────────────────────
// Uses the real slice implementations so cross-slice get() reads work.

function makeStore() {
  return create<AppState>()((...args) => ({
    ...createNavigationSlice(...args),
    ...createModeSlice(...args),
    ...createTerminalSlice(...args),
    ...createGameSlice(...args),
    ...createSessionSlice(...args),
    ...createContentSlice(...args),
  }))
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getHistory(store: ReturnType<typeof makeStore>) {
  return store.getState().history
}

describe('terminalSlice — session integration (Doc 08 §4.4)', () => {
  let useStore: ReturnType<typeof makeStore>

  beforeEach(() => {
    useStore = makeStore()
    vi.clearAllMocks()
  })

  // ── 1. Submit known command ───────────────────────────────────────────────

  it('submit known command → history has input entry + output entry', () => {
    useStore.getState().submitCommand('help')
    const history = getHistory(useStore)
    expect(history).toHaveLength(2)
    expect(history[0].type).toBe('input')
    expect(history[0].content).toBe('help')
    expect(history[1].type).toBe('output')
    expect(history[1].content.length).toBeGreaterThan(0)
  })

  it('submit known command "status" → output contains version', () => {
    // Load minimal meta so status has data
    useStore.getState().loadContent({
      projects: [],
      skills: [],
      edges: [],
      timeline: [],
      arena: null,
      meta: {
        name: 'Govind', version: '3.0', role: 'Engineer', stack: 'Kotlin',
        metrics: [], contact: { email: 'g@g.dev', preferCopy: true },
        links: { github: 'https://github.com/govind', linkedin: 'https://linkedin.com/in/govind' },
        resumeAssetPath: '/resume.pdf',
      },
    })
    useStore.getState().submitCommand('status')
    const output = getHistory(useStore).find((e) => e.type === 'output')
    expect(output?.content).toContain('3.0')
    expect(output?.content).toContain('Engineer')
  })

  // ── 2. Submit unknown command ─────────────────────────────────────────────

  it('submit unknown command → input entry + error entry', () => {
    useStore.getState().submitCommand('foobar')
    const history = getHistory(useStore)
    expect(history).toHaveLength(2)
    expect(history[0].type).toBe('input')
    expect(history[1].type).toBe('error')
    expect(history[1].content).toContain('command not found')
  })

  // ── 3. clear command ──────────────────────────────────────────────────────

  it('clear → history array emptied; terminal remains open', () => {
    useStore.getState().openTerminal()
    useStore.getState().submitCommand('help')
    expect(getHistory(useStore).length).toBeGreaterThan(0)

    useStore.getState().submitCommand('clear')
    expect(getHistory(useStore)).toHaveLength(0)
    expect(useStore.getState().isOpen).toBe(true)
  })

  it('cls alias → same as clear', () => {
    useStore.getState().submitCommand('help')
    expect(getHistory(useStore).length).toBeGreaterThan(0)
    useStore.getState().submitCommand('cls')
    expect(getHistory(useStore)).toHaveLength(0)
  })

  // ── 4. exit command ───────────────────────────────────────────────────────

  it('exit → terminal closed; output entry appended; history preserved', () => {
    useStore.getState().openTerminal()
    useStore.getState().submitCommand('help')
    const lengthBeforeExit = getHistory(useStore).length

    useStore.getState().submitCommand('exit')

    // Terminal is closed
    expect(useStore.getState().isOpen).toBe(false)
    // History preserved (input + output for 'exit' added on top of 'help' entries)
    expect(getHistory(useStore).length).toBeGreaterThan(lengthBeforeExit)
    // The output entry for exit is present
    const exitOutput = getHistory(useStore).find(
      (e) => e.type === 'output' && e.content.includes('Closing')
    )
    expect(exitOutput).toBeDefined()
  })

  it('quit alias → same as exit', () => {
    useStore.getState().openTerminal()
    useStore.getState().submitCommand('quit')
    expect(useStore.getState().isOpen).toBe(false)
  })

  // ── 5. inputBuffer cleared after submit ───────────────────────────────────

  it('inputBuffer is cleared after submitCommand', () => {
    useStore.getState().setInputBuffer('help')
    expect(useStore.getState().inputBuffer).toBe('help')
    useStore.getState().submitCommand('help')
    expect(useStore.getState().inputBuffer).toBe('')
  })

  // ── 6. Session history preserved across zone transitions ──────────────────

  it('history survives navigateTo (zone transition does not reset terminal)', () => {
    useStore.getState().submitCommand('help')
    const lenBefore = getHistory(useStore).length
    expect(lenBefore).toBeGreaterThan(0)

    useStore.getState().navigateTo('memory-vault')

    expect(getHistory(useStore).length).toBe(lenBefore)
  })

  // ── 7. Empty / whitespace-only input ──────────────────────────────────────

  it('empty string → no history change', () => {
    useStore.getState().submitCommand('')
    expect(getHistory(useStore)).toHaveLength(0)
  })

  it('whitespace-only input → no history change', () => {
    useStore.getState().submitCommand('   ')
    expect(getHistory(useStore)).toHaveLength(0)
  })

  // ── 8. Case-insensitive lookup ────────────────────────────────────────────

  it('uppercase command resolves correctly', () => {
    useStore.getState().submitCommand('HELP')
    const history = getHistory(useStore)
    expect(history[1].type).toBe('output')
    expect(history[1].content).not.toContain('command not found')
  })

  // ── 9. goto edge cases ───────────────────────────────────────────────────

  it('goto with no args → usage error in output', () => {
    useStore.getState().submitCommand('goto')
    const out = getHistory(useStore).find((e) => e.type === 'output')
    expect(out?.content).toContain('Usage')
  })

  it('goto with invalid zone → error output; activeZone unchanged', () => {
    const before = useStore.getState().activeZone
    useStore.getState().submitCommand('goto not-a-zone')
    const out = getHistory(useStore).find((e) => e.type === 'output')
    expect(out?.content).toContain('Unknown zone')
    // activeZone not changed (navigateTo not called with invalid ID)
    expect(useStore.getState().activeZone).toBe(before)
  })

  it('goto with valid zone → confirmation output; navigation triggered', () => {
    useStore.getState().submitCommand('goto memory-vault')
    const out = getHistory(useStore).find((e) => e.type === 'output')
    expect(out?.content).toContain('Memory Vault')
    expect(useStore.getState().activeZone).toBe('memory-vault')
  })

  // ── 10. Alias parity ─────────────────────────────────────────────────────

  it('? alias → same output structure as help', () => {
    useStore.getState().submitCommand('?')
    const history = getHistory(useStore)
    expect(history[1].type).toBe('output')
    expect(history[1].content).toContain('help')
  })

  it('help output contains all command names', () => {
    useStore.getState().submitCommand('help')
    const output = getHistory(useStore).find((e) => e.type === 'output')!
    const EXPECTED_COMMANDS = ['help', 'status', 'projects', 'skills', 'github', 'clear', 'exit', 'goto']
    for (const cmd of EXPECTED_COMMANDS) {
      expect(output.content).toContain(cmd)
    }
  })

  // ── 11. addSuggestionOutput ───────────────────────────────────────────────

  it('addSuggestionOutput appends output entry without treating as command', () => {
    useStore.getState().addSuggestionOutput('help  status  goto')
    const history = getHistory(useStore)
    expect(history).toHaveLength(1)
    expect(history[0].type).toBe('output')
    expect(history[0].content).toBe('help  status  goto')
  })
})