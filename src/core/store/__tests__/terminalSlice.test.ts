import { describe, it, expect, beforeEach } from 'vitest'
import { create } from 'zustand'
import { createTerminalSlice, type TerminalSlice } from '../terminalSlice'

const makeStore = () =>
  create<TerminalSlice>()((...args) => ({ ...createTerminalSlice(...args) }))

describe('terminalSlice', () => {
  let useStore: ReturnType<typeof makeStore>

  beforeEach(() => {
    useStore = makeStore()
  })

  it('submitCommand appends input and output stub entries', () => {
    useStore.getState().submitCommand('help')
    const { history } = useStore.getState()
    expect(history).toHaveLength(2)
    expect(history[0].type).toBe('input')
    expect(history[0].content).toBe('help')
    expect(history[1].type).toBe('output')
    expect(history[1].content).toContain('command registry not yet connected')
  })

  it('submitCommand with empty string: no history change', () => {
    useStore.getState().submitCommand('   ')
    expect(useStore.getState().history).toHaveLength(0)
  })

  it('submitCommand clears inputBuffer after submission', () => {
    useStore.getState().setInputBuffer('help')
    useStore.getState().submitCommand('help')
    expect(useStore.getState().inputBuffer).toBe('')
  })

  it('clearHistory empties history array', () => {
    useStore.getState().submitCommand('help')
    useStore.getState().clearHistory()
    expect(useStore.getState().history).toHaveLength(0)
  })

  it('closeTerminal preserves history', () => {
    useStore.getState().submitCommand('help')
    useStore.getState().closeTerminal()
    expect(useStore.getState().history).toHaveLength(2)
    expect(useStore.getState().isOpen).toBe(false)
  })

  it('setInputBuffer updates inputBuffer', () => {
    useStore.getState().setInputBuffer('go')
    expect(useStore.getState().inputBuffer).toBe('go')
  })
})