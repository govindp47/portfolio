import { describe, it, expect, beforeEach } from 'vitest'
import { create } from 'zustand'
import { createModeSlice, type ModeSlice } from './modeSlice'

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