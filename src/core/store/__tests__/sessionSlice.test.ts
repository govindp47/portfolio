import { describe, it, expect, beforeEach, vi } from 'vitest'
import { create } from 'zustand'

describe('sessionSlice', () => {
  beforeEach(() => {
    sessionStorage.clear()
    vi.resetModules()
  })

  it('bootPlayed seeds false when sessionStorage is empty', async () => {
    const { createSessionSlice } = await import('../sessionSlice')
    const useStore = create((...args: Parameters<typeof createSessionSlice>) => ({
      ...createSessionSlice(...args),
    }))
    expect(useStore.getState().bootPlayed).toBe(false)
  })

  it('bootPlayed seeds true when sessionStorage key is set', async () => {
    sessionStorage.setItem('govindos-boot-played', 'true')
    const { createSessionSlice } = await import('../sessionSlice')
    const useStore = create((...args: Parameters<typeof createSessionSlice>) => ({
      ...createSessionSlice(...args),
    }))
    expect(useStore.getState().bootPlayed).toBe(true)
  })

  it('markBootPlayed sets flag and writes sessionStorage', async () => {
    const { createSessionSlice } = await import('../sessionSlice')
    const useStore = create((...args: Parameters<typeof createSessionSlice>) => ({
      ...createSessionSlice(...args),
    }))
    useStore.getState().markBootPlayed()
    expect(useStore.getState().bootPlayed).toBe(true)
    expect(sessionStorage.getItem('govindos-boot-played')).toBe('true')
  })

  it('dismissGuidedFlow sets guidedFlowDismissed', async () => {
    const { createSessionSlice } = await import('../sessionSlice')
    const useStore = create((...args: Parameters<typeof createSessionSlice>) => ({
      ...createSessionSlice(...args),
    }))
    useStore.getState().dismissGuidedFlow()
    expect(useStore.getState().guidedFlowDismissed).toBe(true)
  })

  it('markContentLoaded sets contentLoaded', async () => {
    const { createSessionSlice } = await import('../sessionSlice')
    const useStore = create((...args: Parameters<typeof createSessionSlice>) => ({
      ...createSessionSlice(...args),
    }))
    useStore.getState().markContentLoaded()
    expect(useStore.getState().contentLoaded).toBe(true)
  })
})