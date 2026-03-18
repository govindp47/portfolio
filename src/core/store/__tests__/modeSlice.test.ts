import { describe, it, expect, beforeEach } from 'vitest'
import { create } from 'zustand'
import { createModeSlice, type ModeSlice } from '../modeSlice'

const makeStore = () =>
  create<ModeSlice>()((...args) => ({ ...createModeSlice(...args) }))

describe('modeSlice', () => {
  let useStore: ReturnType<typeof makeStore>

  beforeEach(() => {
    useStore = makeStore()
  })

  it('setMode with different mode: activeMode updates', () => {
    useStore.getState().setMode('recruiter')
    expect(useStore.getState().activeMode).toBe('recruiter')
  })

  it('setMode with current mode: no state change (reference equality)', () => {
    const before = useStore.getState()
    // Default is 'explorer' on desktop (jsdom innerWidth = 0 → isMobile = true → 'recruiter')
    const currentMode = before.activeMode
    useStore.getState().setMode(currentMode)
    expect(useStore.getState()).toBe(before)
  })

  it('isMobile is a boolean and never undefined', () => {
    expect(typeof useStore.getState().isMobile).toBe('boolean')
  })
})

describe('modeSlice — integration: mode transitions (Doc 08 §4.2)', () => {
  let useStore: ReturnType<typeof makeStore>

  beforeEach(() => {
    useStore = makeStore()
  })

  it('can switch to all four modes independently', () => {
    const modes = ['explorer', 'recruiter', 'deep', 'safe'] as const
    for (const mode of modes) {
      useStore.getState().setMode(mode)
      expect(useStore.getState().activeMode).toBe(mode)
    }
  })

  it('setMode to same mode twice: state object reference unchanged (no re-render)', () => {
    useStore.getState().setMode('recruiter')
    const after = useStore.getState()
    useStore.getState().setMode('recruiter')
    expect(useStore.getState()).toBe(after)
  })

  it('mode transitions are reversible: explorer → deep → explorer', () => {
    useStore.getState().setMode('deep')
    expect(useStore.getState().activeMode).toBe('deep')
    useStore.getState().setMode('explorer')
    expect(useStore.getState().activeMode).toBe('explorer')
  })

  it('isMobile never changes after store init', () => {
    const initial = useStore.getState().isMobile
    useStore.getState().setMode('deep')
    useStore.getState().setMode('safe')
    expect(useStore.getState().isMobile).toBe(initial)
  })

  it('setMode sequence: all transitions produce correct final state', () => {
    useStore.getState().setMode('safe')
    useStore.getState().setMode('recruiter')
    useStore.getState().setMode('explorer')
    expect(useStore.getState().activeMode).toBe('explorer')
  })
})